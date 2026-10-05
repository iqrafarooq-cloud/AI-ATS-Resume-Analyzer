import type {
  ExperienceAnalysis,
  Importance,
  KeywordMatch,
  RequirementMatch,
  ScoreBreakdown,
  ScoreLabel,
  SectionAnalysis,
  SkillMatch,
} from "@/lib/schemas";
import { clamp } from "@/lib/text";

export const WEIGHTS = {
  jobMatch: 0.3,
  keyword: 0.2,
  skills: 0.15,
  experience: 0.15,
  ats: 0.1,
  resumeQuality: 0.1,
} as const;

const IMPORTANCE_WEIGHT: Record<Importance, number> = { required: 3, preferred: 1.5, nice: 1 };
const LEVEL_VALUE = { strong: 1, partial: 0.5, gap: 0 } as const;

export function scoreLabel(score: number): ScoreLabel {
  if (score >= 90) return "Excellent Match";
  if (score >= 80) return "Strong Match";
  if (score >= 70) return "Good Match";
  if (score >= 60) return "Moderate Match";
  return "Needs Improvement";
}

function weightedAverage<T>(items: T[], weight: (t: T) => number, value: (t: T) => number, fallback: number): number {
  const total = items.reduce((s, i) => s + weight(i), 0);
  if (total === 0) return fallback;
  return (items.reduce((s, i) => s + weight(i) * value(i), 0) / total) * 100;
}

export function keywordScore(matched: KeywordMatch[], underused: KeywordMatch[], missing: KeywordMatch[]): number {
  const all = [
    ...matched.map((k) => ({ k, v: 1 })),
    ...underused.map((k) => ({ k, v: 0.6 })),
    ...missing.map((k) => ({ k, v: 0 })),
  ].filter(({ k }) => k.category !== "soft_skill");
  return clamp(Math.round(weightedAverage(all, ({ k }) => IMPORTANCE_WEIGHT[k.importance], ({ v }) => v, 50)));
}

export function skillsScore(skills: SkillMatch[]): number {
  return clamp(Math.round(weightedAverage(skills, (s) => IMPORTANCE_WEIGHT[s.importance], (s) => s.coverage / 100, 50)));
}

export function jobMatchScore(requirements: RequirementMatch[]): number {
  return clamp(Math.round(weightedAverage(requirements, (r) => IMPORTANCE_WEIGHT[r.importance], (r) => LEVEL_VALUE[r.level], 50)));
}

/** Recent roles count more. Blends role relevance (75%) with bullet quality (25%). */
export function experienceScore(roles: ExperienceAnalysis[], yearsRequired: number | null, yearsFound: number | null): number {
  if (roles.length === 0) return 15;
  const relevance = weightedAverage(roles.slice(0, 6), (r) => 1 / (r.index + 1), (r) => r.matchPercent / 100, 0);
  const quality = roles.reduce((s, r) => s + r.bulletQuality, 0) / roles.length;
  let score = relevance * 0.75 + quality * 0.25;
  if (yearsRequired && yearsFound !== null && yearsFound < yearsRequired) {
    score -= Math.min(15, (yearsRequired - yearsFound) * 5);
  }
  return clamp(Math.round(score));
}

export function resumeQualityScore(sections: SectionAnalysis[], roles: ExperienceAnalysis[]): number {
  const scored = sections.filter((s) => s.score !== null);
  const sectionAvg = scored.length ? scored.reduce((s, x) => s + (x.score ?? 0), 0) / scored.length : 50;
  const bulletAvg = roles.length ? roles.reduce((s, r) => s + r.bulletQuality, 0) / roles.length : sectionAvg;
  return clamp(Math.round(sectionAvg * 0.6 + bulletAvg * 0.4));
}

export function combineScores(parts: Omit<ScoreBreakdown, "overall" | "label" | "weights">): ScoreBreakdown {
  const overall = clamp(
    Math.round(
      parts.jobMatch * WEIGHTS.jobMatch +
        parts.keyword * WEIGHTS.keyword +
        parts.skills * WEIGHTS.skills +
        parts.experience * WEIGHTS.experience +
        parts.ats * WEIGHTS.ats +
        parts.resumeQuality * WEIGHTS.resumeQuality,
    ),
  );
  return { ...parts, overall, label: scoreLabel(overall), weights: { ...WEIGHTS } };
}

/** Rough total years from date ranges (overlaps not merged; used only as a soft signal). */
export function estimateYears(roles: { startDate: string | null; endDate: string | null }[]): number | null {
  const now = new Date().getFullYear();
  const spans = roles
    .map((r) => {
      const start = Number(r.startDate?.match(/\d{4}/)?.[0]);
      const end = /present|current|now/i.test(r.endDate ?? "") ? now : Number(r.endDate?.match(/\d{4}/)?.[0]);
      return start && end && end >= start ? [start, end] : null;
    })
    .filter((s): s is number[] => s !== null);
  if (!spans.length) return null;
  return Math.max(...spans.map((s) => s[1])) - Math.min(...spans.map((s) => s[0]));
}
