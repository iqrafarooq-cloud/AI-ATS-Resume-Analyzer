import { TERMS } from "@/lib/analysis/dictionary";
import type { Importance, JobData, JobKeyword, Seniority } from "@/lib/schemas";
import { aliasesFor, containsTerm, countOccurrences, normalizeText, uniqueBy } from "@/lib/text";

type Zone = "required" | "preferred" | "responsibilities" | "other";

const ZONE_PATTERNS: [Zone, RegExp][] = [
  ["preferred", /(preferred|nice to have|nice-to-have|bonus|plus|desired|good to have)/i],
  ["required", /(requirements|required|qualifications|must have|must-have|what you('|\u2019)ll need|what we('|\u2019)re looking for|you have|skills|who you are)/i],
  ["responsibilities", /(responsibilities|what you('|\u2019)ll do|the role|duties|day to day|in this role|your impact)/i],
];

function zoneOf(line: string): Zone | null {
  if (line.length > 70) return null;
  for (const [zone, re] of ZONE_PATTERNS) if (re.test(line)) return zone;
  return null;
}

const SENIORITY: [Seniority, RegExp][] = [
  ["director", /\b(director|head of|vp|vice president)\b/i],
  ["principal", /\b(principal|staff|distinguished)\b/i],
  ["manager", /\b(manager|management)\b/i],
  ["lead", /\b(lead|team lead|tech lead)\b/i],
  ["senior", /\b(senior|sr\.?)\b/i],
  ["junior", /\b(junior|jr\.?|entry[- ]level|graduate|associate)\b/i],
  ["intern", /\b(intern|internship)\b/i],
  ["mid", /\b(mid[- ]level|intermediate)\b/i],
];

const TITLE_WORDS =
  /\b(engineer|developer|analyst|manager|designer|scientist|tester|specialist|consultant|architect|administrator|lead|director|coordinator|associate|intern|officer|strategist|writer|marketer|representative|technician|qa|sdet)\b/i;

function detectTitle(lines: string[]): string {
  for (const line of lines.slice(0, 12)) {
    const labeled = line.match(/^(job title|title|position|role)\s*[:-]\s*(.+)$/i);
    if (labeled) return labeled[2].trim().slice(0, 100);
  }
  const candidate = lines.slice(0, 8).find((l) => l.length < 80 && TITLE_WORDS.test(l) && !/[.!?]$/.test(l));
  if (candidate) return candidate.replace(/^(we('|\u2019)re hiring|hiring|join us as)\s*(an?|a)?\s*/i, "").trim();
  const sentence = lines.join(" ").match(/(?:looking for|hiring|seeking)\s+(?:an?\s+)?([A-Z][\w/ -]{3,60}?(?:engineer|developer|analyst|manager|designer|scientist|tester|specialist|lead|architect))/i);
  return sentence ? sentence[1].trim() : "Target role";
}

function whyItMatters(term: string, importance: Importance, mentions: number): string {
  if (importance === "required") {
    return `Listed as a core requirement${mentions > 1 ? ` and mentioned ${mentions} times` : ""}; recruiters and ATS filters commonly screen for it.`;
  }
  if (importance === "preferred") return `A preferred qualification that can differentiate you from other qualified applicants.`;
  return `Mentioned in the posting, so it signals familiarity with the team's environment.`;
}

/** Deterministic job description extraction. Also used for the live preview on the Analyze page. */
export function extractJobHeuristic(rawText: string): JobData {
  const text = normalizeText(rawText);
  const lines = text.split("\n").filter(Boolean);

  const zoneText: Record<Zone, string[]> = { required: [], preferred: [], responsibilities: [], other: [] };
  let zone: Zone = "other";
  for (const line of lines) {
    const z = zoneOf(line);
    if (z) {
      zone = z;
      continue;
    }
    zoneText[zone].push(line);
    // Inline cues ("Experience with X is a plus") override the current block.
    if (zone !== "preferred" && /(is a plus|nice to have|preferred|bonus)/i.test(line)) zoneText.preferred.push(line);
  }

  const reqText = zoneText.required.join("\n");
  const prefText = zoneText.preferred.join("\n");
  const keywords: JobKeyword[] = [];

  for (const t of TERMS) {
    const variants = [t.term, ...aliasesFor(t.term)];
    const mentions = variants.reduce((n, v) => n + countOccurrences(text, v), 0);
    if (mentions === 0) continue;
    const inPref = variants.some((v) => containsTerm(prefText, v));
    const inReq = variants.some((v) => containsTerm(reqText, v));
    const importance: Importance =
      inReq && !inPref ? "required" : inPref && !inReq ? "preferred" : inReq ? "required" : mentions >= 2 ? "required" : "nice";
    keywords.push({ term: t.term, importance, category: t.category, whyItMatters: whyItMatters(t.term, importance, mentions), aliases: t.aliases ?? [] });
  }

  const hardish = keywords.filter((k) => k.category !== "soft_skill" && k.category !== "certification");
  const title = detectTitle(lines);
  const seniority = SENIORITY.find(([, re]) => re.test(title))?.[0] ?? SENIORITY.find(([, re]) => re.test(lines.slice(0, 15).join(" ")))?.[0] ?? "unknown";
  const yearsMatch = text.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?years?/i);

  const bulletLike = (arr: string[]) =>
    arr.map((l) => l.replace(/^(?:[\u2022*\-\u00b7]|\d+[.)])\s*/, "").trim()).filter((l) => l.length > 15 && l.length < 300);

  const responsibilities = bulletLike(zoneText.responsibilities).slice(0, 10);
  const requirementLines = bulletLike(zoneText.required);

  const required = hardish.filter((k) => k.importance === "required").map((k) => k.term);
  const preferred = hardish.filter((k) => k.importance !== "required").map((k) => k.term);

  const priorities: JobData["recruiterPriorities"] = [];
  if (required.length) priorities.push({ priority: `Hands-on experience with ${required.slice(0, 3).join(", ")}`, rationale: "These are the most emphasized technical requirements in the posting." });
  if (yearsMatch) priorities.push({ priority: `Around ${yearsMatch[1]}+ years of relevant experience`, rationale: "The posting states an explicit experience threshold." });
  if (responsibilities.length) priorities.push({ priority: "Evidence of owning the listed responsibilities", rationale: `Responsibilities such as "${responsibilities[0].slice(0, 80)}" suggest what success in the role looks like.` });
  const soft = keywords.filter((k) => k.category === "soft_skill").map((k) => k.term);
  if (soft.length) priorities.push({ priority: `Demonstrated ${soft.slice(0, 2).join(" and ").toLowerCase()}`, rationale: "Soft skills are called out explicitly in the description." });

  return {
    title,
    seniority,
    company: null,
    requiredSkills: required,
    preferredSkills: preferred,
    responsibilities,
    educationRequirements: requirementLines.filter((l) => /(degree|bachelor|master|phd|b\.s|m\.s|diploma)/i.test(l)).slice(0, 3),
    experienceRequirements: requirementLines.filter((l) => /(years|experience)/i.test(l)).slice(0, 5),
    yearsOfExperience: yearsMatch ? Number(yearsMatch[1]) : null,
    certifications: keywords.filter((k) => k.category === "certification").map((k) => k.term),
    tools: keywords.filter((k) => k.category === "tool").map((k) => k.term),
    domainKeywords: keywords.filter((k) => k.category === "domain").map((k) => k.term),
    softSkills: soft,
    keywords: uniqueBy(keywords, (k) => k.term),
    recruiterPriorities: priorities,
    confidence: keywords.length >= 5 ? 0.6 : 0.35,
  };
}
