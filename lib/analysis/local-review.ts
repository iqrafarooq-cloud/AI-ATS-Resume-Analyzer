import { localRewriteBullet, scoreBullet } from "@/lib/analysis/bullets";
import type { ResumeCorpus } from "@/lib/analysis/matching";
import type {
  ExperienceReview,
  JobData,
  KeywordMatch,
  MatchLevel,
  MatchReview,
  ResumeData,
  ResumeReview,
  SkillsAdvice,
} from "@/lib/schemas";
import { aliasesFor, clamp, containsTerm, findEvidence, findKnownTerms } from "@/lib/text";

/** Rule-based equivalents of the AI review stages, used without an API key or when a stage fails. */

export function localMatchReview(
  job: JobData,
  corpus: ResumeCorpus,
  keywords: { matched: KeywordMatch[]; missing: KeywordMatch[]; underused: KeywordMatch[] },
): MatchReview {
  const requirements: MatchReview["requirements"] = [];
  const levelFor = (term: string): { level: MatchLevel; evidence: string | null } => {
    const variants = [term, ...aliasesFor(term)];
    const evidence = findEvidence(corpus.lines, variants);
    if (!evidence) return { level: "gap", evidence: null };
    return { level: variants.some((v) => containsTerm(corpus.experience, v)) ? "strong" : "partial", evidence };
  };

  for (const skill of job.requiredSkills.slice(0, 8)) {
    const { level, evidence } = levelFor(skill);
    requirements.push({ requirement: skill, importance: "required", level, evidence, note: level === "strong" ? "Demonstrated in your experience." : level === "partial" ? "Mentioned, but not shown in an experience bullet." : "No evidence found in your resume." });
  }
  for (const req of [...job.experienceRequirements, ...job.educationRequirements].slice(0, 4)) {
    const terms = findKnownTerms(req);
    const hit = terms.filter((t) => containsTerm(corpus.full, t)).length;
    const level: MatchLevel = terms.length === 0 ? "partial" : hit === terms.length ? "strong" : hit > 0 ? "partial" : "gap";
    requirements.push({ requirement: req.length > 90 ? `${req.slice(0, 87)}...` : req, importance: "required", level, evidence: terms.length ? findEvidence(corpus.lines, terms) : null, note: terms.length === 0 ? "We couldn't check this one automatically, so give it a quick look yourself." : `${hit} of ${terms.length} related terms found.` });
  }
  for (const skill of job.preferredSkills.slice(0, 4)) {
    const { level, evidence } = levelFor(skill);
    requirements.push({ requirement: skill, importance: "preferred", level, evidence, note: level === "gap" ? "Preferred skill not found." : "Preferred skill present." });
  }

  const reqMatched = keywords.matched.filter((k) => k.importance === "required");
  const reqMissing = keywords.missing.filter((k) => k.importance === "required");
  const strengths: MatchReview["strengths"] = [];
  const weaknesses: MatchReview["weaknesses"] = [];

  if (reqMatched.length) strengths.push({ title: "Core requirements demonstrated", detail: `Your experience shows ${reqMatched.slice(0, 4).map((k) => k.term).join(", ")}.` });
  if (keywords.matched.length >= 5) strengths.push({ title: "Good keyword coverage", detail: `${keywords.matched.length} of the job's key terms appear in your experience.` });
  if (keywords.underused.length) strengths.push({ title: "Relevant skills already listed", detail: `${keywords.underused.slice(0, 3).map((k) => k.term).join(", ")} appear in your resume and can be strengthened with context.` });
  if (reqMissing.length) weaknesses.push({ title: "Missing required skills", detail: `No evidence of ${reqMissing.slice(0, 4).map((k) => k.term).join(", ")}. Add these only if you actually have this experience.`, impact: "high" });
  if (keywords.underused.length >= 2) weaknesses.push({ title: "Skills listed without supporting evidence", detail: `${keywords.underused.slice(0, 3).map((k) => k.term).join(", ")} aren't backed by experience bullets.`, impact: "medium" });

  const total = keywords.matched.length + keywords.underused.length + keywords.missing.length;
  return {
    requirements,
    skills: [],
    strengths,
    weaknesses,
    scoreExplanation: `Your resume demonstrates ${keywords.matched.length} of ${total} key terms from this ${job.title} posting${reqMissing.length ? `, but required areas such as ${reqMissing.slice(0, 3).map((k) => k.term).join(", ")} have no supporting evidence` : ""}. ${keywords.underused.length ? `${keywords.underused.length} relevant skills are mentioned but not shown in context.` : ""}`.trim(),
  };
}

export function localExperienceReview(resume: ResumeData, job: JobData): ExperienceReview {
  const jobTerms = job.keywords.map((k) => k.term);
  const required = job.requiredSkills;
  const roles = resume.experience.slice(0, 6).map((role, roleIndex) => {
    const text = `${role.title} ${role.bullets.join(" ")}`;
    const hits = jobTerms.filter((t) => [t, ...aliasesFor(t)].some((v) => containsTerm(text, v)));
    const missing = required.filter((s) => !containsTerm(text, s)).slice(0, 3);
    const metricCount = role.bullets.filter((b) => scoreBullet(b, 0, jobTerms).criteria.metric === "strong").length;
    return {
      roleIndex,
      matchPercent: clamp(Math.round((hits.length / Math.max(4, Math.min(10, jobTerms.length * 0.5))) * 100)),
      strengths: hits.length ? [`Shows ${hits.slice(0, 4).join(", ")}.`] : [],
      weaknesses: [...(metricCount === 0 && role.bullets.length ? ["No bullets include measurable outcomes."] : []), ...(hits.length === 0 ? ["Little overlap with the target job's requirements."] : [])],
      relevantTechnologies: findKnownTerms(text).filter((t) => jobTerms.includes(t)),
      missingEvidence: missing,
      suggestions: [...(missing.length ? [`If you used ${missing[0]} in this role, describe how.`] : []), ...(metricCount === 0 ? ["Consider adding a metric if you have one."] : [])],
    };
  });

  const bullets: ExperienceReview["bullets"] = [];
  resume.experience.slice(0, 6).forEach((role, roleIndex) =>
    role.bullets.forEach((b, bulletIndex) => {
      const { suggestion, rationale } = localRewriteBullet(b);
      if (suggestion && bullets.length < 10) bullets.push({ roleIndex, bulletIndex, suggestion, rationale });
    }),
  );
  return { roles, bullets };
}

export function localSkillsAdvice(resume: ResumeData, job: JobData, corpus: ResumeCorpus): SkillsAdvice {
  const jobSkills = [...job.requiredSkills, ...job.preferredSkills];
  const listed = resume.skills.join(", ");
  const emphasize = resume.skills.filter((s) => jobSkills.some((j) => containsTerm(s, j) || containsTerm(j, s)));
  const buried = jobSkills.filter((s) => containsTerm(corpus.experience, s) && !containsTerm(listed, s));
  const absent = jobSkills.filter((s) => ![s, ...aliasesFor(s)].some((v) => containsTerm(corpus.full, v)));
  return {
    emphasize: emphasize.slice(0, 8),
    reorder: emphasize.slice(0, 6),
    buried: buried.slice(0, 6),
    doNotAddUnlessTrue: absent.slice(0, 8),
    notes: emphasize.length ? "Lead your skills list with the tools this job names most often." : "Few of your listed skills overlap with this job. It's worth checking that your skills section reflects your most relevant experience.",
  };
}

export function localResumeReview(resume: ResumeData, job: JobData, corpus: ResumeCorpus): ResumeReview {
  const latest = resume.experience[0];
  const relevant = findKnownTerms(corpus.full).filter((t) => job.keywords.some((k) => k.term === t)).slice(0, 4);
  const suggested =
    latest && relevant.length >= 2
      ? `${latest.title} with hands-on experience in ${relevant.slice(0, -1).join(", ")} and ${relevant[relevant.length - 1]}${latest.company ? `, most recently at ${latest.company}` : ""}.`
      : null;

  return {
    sections: [],
    atsNotes: [],
    recommendations: [],
    summary: {
      analysis: resume.summary
        ? [
            relevant.some((t) => containsTerm(resume.summary!, t)) ? "Mentions some of the job's key skills." : "Doesn't mention the job's key skills.",
            "Make sure it names the type of role you're targeting.",
          ]
        : ["Your resume has no professional summary.", "A short, tailored summary helps recruiters see your fit in seconds."],
      suggested,
    },
    skillsAdvice: localSkillsAdvice(resume, job, corpus),
  };
}
