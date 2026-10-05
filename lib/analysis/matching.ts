import type { Importance, JobData, KeywordMatch, MatchLevel, MatchReview, ResumeData, SkillMatch } from "@/lib/schemas";
import { aliasesFor, containsTerm, countOccurrences, findEvidence, uniqueBy } from "@/lib/text";

export interface ResumeCorpus {
  full: string;
  experience: string;
  lines: string[];
}

export function buildCorpus(text: string, resume: ResumeData): ResumeCorpus {
  const experience = [
    ...resume.experience.flatMap((r) => [r.title, ...r.bullets]),
    ...resume.projects.flatMap((p) => [p.name, p.description, ...p.technologies]),
  ].join("\n");
  return { full: text, experience, lines: text.split("\n").filter((l) => l.length > 3) };
}

function variantsOf(term: string, aliases: string[] = []): string[] {
  return uniqueBy([term, ...aliases.filter((a) => a.length > 2), ...aliasesFor(term)], (v) => v);
}

const IMPORTANCE_ORDER: Record<Importance, number> = { required: 0, preferred: 1, nice: 2 };

/** Deterministic keyword presence analysis over AI- or rule-extracted job keywords. */
export function analyzeKeywords(job: JobData, corpus: ResumeCorpus) {
  const matched: KeywordMatch[] = [];
  const missing: KeywordMatch[] = [];
  const underused: KeywordMatch[] = [];

  for (const k of uniqueBy(job.keywords, (k) => k.term)) {
    const variants = variantsOf(k.term, k.aliases);
    const exactCount = countOccurrences(corpus.full, k.term);
    const count = variants.reduce((n, v) => n + countOccurrences(corpus.full, v), 0);
    const inExperience = variants.some((v) => containsTerm(corpus.experience, v));
    const entry: KeywordMatch = {
      term: k.term,
      importance: k.importance,
      category: k.category,
      count,
      inExperience,
      whyItMatters: k.whyItMatters,
      hasRelatedEvidence: count > 0 && exactCount === 0,
    };
    if (count === 0) missing.push(entry);
    else if (inExperience && (count >= 2 || k.importance !== "required")) matched.push(entry);
    else underused.push(entry);
  }

  const sort = (a: KeywordMatch, b: KeywordMatch) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance] || b.count - a.count;
  return { matched: matched.sort(sort), missing: missing.sort(sort), underused: underused.sort(sort) };
}

const LEVEL_COVERAGE: Record<MatchLevel, number> = { strong: 100, partial: 55, gap: 0 };

export function analyzeSkills(job: JobData, corpus: ResumeCorpus, review: MatchReview | null) {
  const aiBySkill = new Map((review?.skills ?? []).map((s) => [s.skill.toLowerCase(), s]));
  const aliasesByTerm = new Map(job.keywords.map((k) => [k.term.toLowerCase(), k.aliases]));

  const skills = uniqueBy(
    [
      ...job.requiredSkills.map((s) => ({ skill: s, importance: "required" as Importance })),
      ...job.preferredSkills.map((s) => ({ skill: s, importance: "preferred" as Importance })),
    ],
    (s) => s.skill,
  ).slice(0, 24);

  const results: SkillMatch[] = skills.map(({ skill, importance }) => {
    const variants = variantsOf(skill, aliasesByTerm.get(skill.toLowerCase()) ?? []);
    const count = variants.reduce((n, v) => n + countOccurrences(corpus.full, v), 0);
    const inExperience = variants.some((v) => containsTerm(corpus.experience, v));
    const deterministic: MatchLevel = inExperience && count >= 2 ? "strong" : count > 0 ? "partial" : "gap";
    const ai = aiBySkill.get(skill.toLowerCase());
    // AI may adjust the level, but can only lift a text-level "gap" to "partial" when it quotes evidence.
    const level: MatchLevel =
      deterministic === "gap"
        ? ai && ai.level !== "gap" && ai.evidence
          ? "partial"
          : "gap"
        : ai
          ? ai.level === "gap"
            ? "partial"
            : ai.level
          : deterministic;
    const coverage = level === "partial" ? Math.min(80, 40 + count * 10) : LEVEL_COVERAGE[level];
    return {
      skill,
      importance,
      level,
      coverage,
      evidence: ai?.evidence ?? findEvidence(corpus.lines, variants),
      explanation:
        ai?.explanation ??
        (level === "strong"
          ? `Demonstrated in your experience (${count} mention${count === 1 ? "" : "s"}).`
          : level === "partial"
            ? inExperience
              ? "Mentioned once. Add a bit more about how you used it."
              : "Listed, but not backed by an experience bullet. Show where you applied it."
            : importance === "required"
              ? "A required skill with no evidence in your resume. This should only be added if you actually have this experience."
              : "A preferred skill not found in your resume. Only add it if you genuinely have it."),
    };
  });

  return {
    strong: results.filter((s) => s.level === "strong"),
    partial: results.filter((s) => s.level === "partial"),
    missing: results.filter((s) => s.level === "gap"),
  };
}
