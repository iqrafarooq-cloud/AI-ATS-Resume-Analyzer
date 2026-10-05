import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/errors";

export interface GenerateJSONOptions<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** Name used in logs and in the schema description sent to the model. */
  name: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  readonly id: string;
  readonly model: string;
  generateJSON<T>(options: GenerateJSONOptions<T>): Promise<T>;
}

type ProviderId = "groq" | "openai" | "anthropic" | "openai-compatible";

const DEFAULTS: Record<ProviderId, { baseUrl: string; model: string }> = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-5-mini" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", model: "claude-sonnet-5-5" },
  "openai-compatible": { baseUrl: "", model: "" },
};

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 120000);

function schemaInstructions(name: string, schema: z.ZodType): string {
  const json = z.toJSONSchema(schema, { target: "draft-7", unrepresentable: "any" });
  delete (json as Record<string, unknown>).$schema;
  return `Respond with a single JSON object named "${name}" that conforms exactly to this JSON Schema. Output JSON only - no markdown, no commentary.\n${JSON.stringify(json)}`;
}

function extractJson(text: string, name: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json object");
  const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1));
  // Some models wrap the payload in its schema name: {"resume": {...}}.
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed);
    if (keys.length === 1 && keys[0] === name) return (parsed as Record<string, unknown>)[name];
  }
  return parsed;
}

/** Limits concurrent provider calls; low token-per-minute tiers (e.g. Groq free) need serial calls. */
class Semaphore {
  private active = 0;
  private queue: (() => void)[] = [];
  constructor(private readonly limit: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((r) => this.queue.push(r));
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.queue.shift()?.();
    }
  }
}

const semaphores = new Map<string, Semaphore>();
function limiterFor(id: string): Semaphore {
  const configured = Number(process.env.AI_CONCURRENCY);
  const limit = Number.isFinite(configured) && configured > 0 ? configured : id === "groq" ? 1 : 4;
  const key = `${id}:${limit}`;
  if (!semaphores.has(key)) semaphores.set(key, new Semaphore(limit));
  return semaphores.get(key)!;
}

/** Parse rate-limit reset hints such as "2", "37.46s", "1m2.5s" or "450ms" into milliseconds. */
function parseResetMs(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+(\.\d+)?$/.test(value)) return Number(value) * 1000;
  const m = value.match(/^(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?(?:(\d+)ms)?$/);
  if (!m) return null;
  return (Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * 1000 + Number(m[3] ?? 0);
}

const MAX_RATE_LIMIT_WAIT_MS = 60000;

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const deadline = Date.now() + TIMEOUT_MS;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())),
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new AppError("AI_TIMEOUT", "The AI provider took too long to respond. Please try again.");
      }
      throw new AppError("AI_FAILED", "We couldn't reach the AI provider. Check your connection and try again.");
    }

    if (res.status === 429 || res.status === 503) {
      const waitMs =
        parseResetMs(res.headers.get("retry-after")) ??
        parseResetMs(res.headers.get("x-ratelimit-reset-tokens")) ??
        2000 * 2 ** attempt;
      const wait = Math.min(MAX_RATE_LIMIT_WAIT_MS, waitMs + 250);
      if (attempt < 8 && Date.now() + wait < deadline) {
        await res.body?.cancel();
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new AppError("AI_FAILED", "The AI provider is rate limiting requests right now. Wait a moment and try again.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new AppError("AI_NOT_CONFIGURED", "The AI provider rejected the API key. Check AI_API_KEY in your environment.");
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      // Groq returns 400 json_validate_failed when the model's own output wasn't valid JSON; worth retrying.
      if (res.status === 400 && detail.includes("json_validate_failed")) throw new MalformedOutputError();
      // Log only the provider's error code: error bodies can echo model output, which may contain resume content.
      const code = detail.match(/"code"\s*:\s*"([\w-]+)"/)?.[1] ?? detail.match(/"type"\s*:\s*"([\w-]+)"/)?.[1] ?? "unknown";
      console.error(`[resumepilot] AI provider HTTP ${res.status} (${code})`);
      throw new AppError("AI_FAILED", "The AI provider returned an error. Please try again.");
    }
    return res.json();
  }
}

class MalformedOutputError extends Error {
  constructor() {
    super("model produced invalid JSON");
  }
}

/** Shared retry loop: one repair attempt when the model returns invalid JSON. */
async function withValidation<T>(
  providerId: string,
  options: GenerateJSONOptions<T>,
  rawCall: (system: string, prompt: string) => Promise<string>,
): Promise<T> {
  const limiter = limiterFor(providerId);
  const call = (system: string, prompt: string) => limiter.run(() => rawCall(system, prompt));
  const system = `${options.system}\n\n${schemaInstructions(options.name, options.schema)}`;
  let prompt = options.prompt;
  let lastIssue = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    let raw: string;
    try {
      raw = await call(system, prompt);
    } catch (error) {
      if (!(error instanceof MalformedOutputError)) throw error;
      lastIssue = "Response was not valid JSON.";
      prompt = `${options.prompt}\n\nYour previous response was not valid JSON. Return one complete, valid JSON object and keep string values concise.`;
      continue;
    }
    // Model output often uses em dashes as pauses; turn them into commas so the copy reads naturally.
    const text = raw.replace(/\s*\u2014\s*/g, ", ").replace(/\u2013/g, "-");
    try {
      const parsed = options.schema.safeParse(extractJson(text, options.name));
      if (parsed.success) return parsed.data;
      lastIssue = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    } catch {
      lastIssue = "Response was not valid JSON.";
    }
    prompt = `${options.prompt}\n\nYour previous response was invalid (${lastIssue}). Return corrected JSON only.`;
  }
  console.error(`[resumepilot] malformed AI response for ${options.name}: ${lastIssue}`);
  throw new AppError("AI_MALFORMED", "The AI returned an unexpected response. Please try again.");
}

class OpenAICompatibleProvider implements AIProvider {
  constructor(
    readonly id: string,
    readonly model: string,
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  generateJSON<T>(options: GenerateJSONOptions<T>): Promise<T> {
    return withValidation(this.id, options, async (system, prompt) => {
      const data = (await postJson(
        `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
        { authorization: `Bearer ${this.apiKey}` },
        {
          model: this.model,
          temperature: options.temperature ?? 0.2,
          max_completion_tokens: options.maxTokens ?? 3000,
          response_format: { type: "json_object" },
          // gpt-oss models are reasoning models; low effort keeps latency and token usage down.
          ...(this.model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        },
      )) as { choices?: { message?: { content?: string } }[] };
      return data.choices?.[0]?.message?.content ?? "";
    });
  }
}

class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  constructor(
    readonly model: string,
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  generateJSON<T>(options: GenerateJSONOptions<T>): Promise<T> {
    return withValidation(this.id, options, async (system, prompt) => {
      const data = (await postJson(
        `${this.baseUrl.replace(/\/$/, "")}/messages`,
        { "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" },
        {
          model: this.model,
          max_tokens: options.maxTokens ?? 3000,
          temperature: options.temperature ?? 0.2,
          system,
          messages: [{ role: "user", content: prompt }],
        },
      )) as { content?: { type: string; text?: string }[] };
      return (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
    });
  }
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY?.trim());
}

export function getProvider(): AIProvider {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError("AI_NOT_CONFIGURED", "AI analysis is not configured. Add AI_API_KEY to your environment.");
  }
  const id = (process.env.AI_PROVIDER?.trim().toLowerCase() || "groq") as ProviderId;
  const defaults = DEFAULTS[id] ?? DEFAULTS["openai-compatible"];
  const baseUrl = process.env.AI_BASE_URL?.trim() || defaults.baseUrl;
  const model = process.env.AI_MODEL?.trim() || defaults.model;
  if (!baseUrl || !model) {
    throw new AppError("AI_NOT_CONFIGURED", "AI_BASE_URL and AI_MODEL are required for an OpenAI-compatible provider.");
  }
  return id === "anthropic" ? new AnthropicProvider(model, baseUrl, apiKey) : new OpenAICompatibleProvider(id, model, baseUrl, apiKey);
}
