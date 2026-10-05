import { ACTION_VERBS, WEAK_OPENERS } from "@/lib/analysis/dictionary";
import type { BulletAnalysis, CriterionRating } from "@/lib/schemas";
import { containsTerm, findKnownTerms } from "@/lib/text";

const METRIC_RE = /(\d+(\.\d+)?\s*(%|percent|x\b|k\b|m\b|hrs?|hours|days|weeks|ms|users|customers|clients)|\$\s?\d|\b\d{2,}\b)/i;
const IMPACT_RE =
  /\b(improv|increas|reduc|decreas|sav|accelerat|boost|cut|grew|growth|enabl|prevent|eliminat|optimi|streamlin|resulting|leading to|so that|which|ensur)\w*/i;

const POINTS: Record<CriterionRating, number> = { strong: 1, good: 0.75, weak: 0.35, missing: 0 };

/** Transparent, rule-based bullet scoring. */
export function scoreBullet(text: string, index: number, jobTerms: string[]): BulletAnalysis {
  const lower = text.toLowerCase().trim();
  const firstWord = lower.split(/\s+/)[0]?.replace(/[^a-z]/g, "") ?? "";
  const weakOpener = WEAK_OPENERS.some((w) => lower.startsWith(w));

  const actionVerb: CriterionRating = weakOpener
    ? "weak"
    : ACTION_VERBS.has(firstWord)
      ? "strong"
      : /ed$|s$/.test(firstWord)
        ? "good"
        : "missing";

  const techHits = findKnownTerms(text).length;
  const technicalDetail: CriterionRating = techHits >= 2 ? "strong" : techHits === 1 ? "good" : text.length > 70 ? "weak" : "missing";

  const words = text.split(/\s+/).length;
  const clarity: CriterionRating = words >= 8 && words <= 32 ? "strong" : words >= 5 && words <= 45 ? "good" : "weak";

  const metric: CriterionRating = METRIC_RE.test(text) ? "strong" : "missing";
  const impact: CriterionRating = metric === "strong" && IMPACT_RE.test(text) ? "strong" : IMPACT_RE.test(text) ? "good" : "weak";

  const relevanceHits = jobTerms.filter((t) => containsTerm(text, t)).length;
  const relevance: CriterionRating = relevanceHits >= 2 ? "strong" : relevanceHits === 1 ? "good" : "weak";

  const criteria = { actionVerb, technicalDetail, clarity, impact, metric, relevance };
  const weights = { actionVerb: 0.2, technicalDetail: 0.2, clarity: 0.1, impact: 0.2, metric: 0.1, relevance: 0.2 };
  const score = Math.round(
    (Object.keys(weights) as (keyof typeof weights)[]).reduce((s, k) => s + POINTS[criteria[k]] * weights[k], 0) * 100,
  );

  return { index, text, score, criteria, suggestion: null, rationale: null };
}

/** Conservative local rewrite: only restructures wording, never adds facts. */
export function localRewriteBullet(text: string): { suggestion: string | null; rationale: string } {
  let out = text.trim().replace(/\.$/, "");
  const lower = out.toLowerCase();
  const opener = WEAK_OPENERS.find((w) => lower.startsWith(w));
  const notes: string[] = [];

  if (opener) {
    const rest = out.slice(opener.length).trim();
    const restWords = rest.split(/\s+/);
    const first = restWords[0]?.toLowerCase() ?? "";
    // "Responsible for testing APIs" -> "Tested APIs"
    if (first.endsWith("ing") && first.length > 4) {
      const stem = first.slice(0, -3);
      const past = /e$/.test(stem) ? `${stem}d` : /[^aeiou][aeiou][bdgmnpt]$/.test(stem) && stem.length <= 4 ? `${stem}${stem.slice(-1)}ed` : `${stem}ed`;
      out = `${past.charAt(0).toUpperCase()}${past.slice(1)} ${restWords.slice(1).join(" ")}`;
    } else {
      const verb = opener.startsWith("helped") || opener.startsWith("assisted") ? "Supported" : opener.startsWith("participated") ? "Contributed to" : "Owned";
      out = `${verb} ${rest}`;
    }
    notes.push(`Replaced the passive opener "${opener}" with a direct action verb.`);
  } else {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }

  if (!METRIC_RE.test(text)) notes.push("Consider adding a metric if you have one (time saved, defects caught, users served).");
  if (out === text.trim().replace(/\.$/, "")) {
    return { suggestion: null, rationale: notes.join(" ") || "This bullet is already well structured." };
  }
  return { suggestion: out, rationale: notes.join(" ") };
}
