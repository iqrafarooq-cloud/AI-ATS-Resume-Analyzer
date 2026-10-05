import { generateImprovement } from "@/lib/ai/analyzer";
import { AppError, toErrorResponse } from "@/lib/errors";
import { ImproveRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = ImproveRequestSchema.safeParse(body);
    if (!parsed.success) throw new AppError("INVALID_INPUT", "This suggestion request was invalid. Please run the analysis again.");
    const result = await generateImprovement(parsed.data);
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
