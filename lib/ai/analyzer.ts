import "server-only";
import { prompts } from "@/lib/ai/prompts";
import { getProvider, isAIConfigured, type AIProvider } from "@/lib/ai/provider";
import { assessAts } from "@/lib/analysis/ats";
import { localRewriteBullet, scoreBullet } from "@/lib/analysis/bullets";
import { findInventedFacts } from "@/lib/analysis/integrity";
import { localExperienceReview, localMatchReview, localResumeReview } from "@/lib/analysis/local-review";
import { analyzeKeywords, analyzeSkills, buildCorpus } from "@/lib/analysis/matching";
import {
  combineScores,
  estimateYears,
  experienceScore,
  jobMatchScore,
  keywordScore,
  resumeQualityScore,
  skillsScore,
} from "@/lib/analysis/scoring";
import { analyzeSections } from "@/lib/analysis/sections";
import { AppError } from "@/lib/errors";
import type { ParsedResumeFile } from "@/lib/parsing";
import { extractJobHeuristic } from "@/lib/parsing/job-heuristics";
import { extractResumeHeuristic } from "@/lib/parsing/resume-heuristics";
import {
  ExperienceReviewSchema,
  ImprovementResponseSchema,
  JobDataSchema,
  MatchReviewSchema,
  ResumeDataSchema,
  ResumeReviewSchema,
  type ExperienceAnalysis,
  type ImproveRequest,
  type ImprovementResponse,
  type Impact,
  type JobData,
  type Readiness,
  type Recommendation,
  type ResumeAnalysis,
  type ResumeData,
} from "@/lib/schemas";
import { containsTerm, findKnownTerms, uniqueBy } from "@/lib/text";

const IMPACT_RANK: Record<Impact, number> = { high: 0, medium: 1, low: 2 };

/** Run an AI stage; on failure, fall back to the deterministic implementation and record a notice. */
async function stage<T>(
  label: string,
  provider: AIProvider | null,
  run: (p: AIProvider) => Promise<T>,
  fallback: () => T,
  notices: string[],
): Promise<{ value: T; ai: boolean }> {
  if (!provider) return { value: fallback(), ai: false };
  try {
    return { value: await run(provider), ai: true };
  } catch (error) {
    const reason = error instanceof AppError ? error.message : "unexpected error";
    console.error(`[resumepilot] AI stage "${label}" failed, using local analysis: ${reason}`);
    notices.push(`We couldn't finish the ${label.toLowerCase()} with AI this time, so that part uses our built-in checks instead. Running the analysis again usually fixes this.`);
    return { value: fallback(), ai: false };
  }
}

/** Keep AI-extracted resume data honest: fill gaps from the heuristic parse. */
function mergeResume(ai: ResumeData, local: ResumeData): ResumeData {
  return {
    ...ai,
    email: ai.email ?? local.email,
    phone: ai.phone ?? local.phone,
    linkedin: ai.linkedin ?? local.linkedin,
    experience: ai.experience.length ? ai.experience : local.experience,
    skills: ai.skills.length ? ai.skills : local.skills,
  };
}

export async function analyzeApplication(input: {
  file: ParsedResumeFile;
  fileName: string;
  jobText: string;
}): Promise<ResumeAnalysis> {
  const { file, fileName, jobText } = input;
  const provider = isAIConfigured() ? getProvider() : null;
  const notices: string[] = [];
  if (!provider) notices.push("AI isn't set up yet, so this report uses ResumePilot's built-in checks only.");

  const localResume = extractResumeHeuristic(file.text);
  const localJob = extractJobHeuristic(jobText);

  // Stage 1: structured extraction (parallel).
  const [resumeStage, jobStage] = await Promise.all([
    stage("Resume extraction", provider, async (p) => {
      const { system, prompt } = prompts.resumeExtraction(file.text);
      return mergeResume(await p.generateJSON({ name: "resume", system, prompt, schema: ResumeDataSchema, maxTokens: 3500 }), localResume);
    }, () => localResume, notices),
    stage("Job analysis", provider, async (p) => {
      const { system, prompt } = prompts.jobExtraction(jobText);
      const job = await p.generateJSON({ name: "job", system, prompt, schema: JobDataSchema, maxTokens: 2500 });
      return job.keywords.length ? job : { ...job, keywords: localJob.keywords };
    }, () => localJob, notices),
  ]);

  const resume = resumeStage.value;
  const job: JobData = jobStage.value;
  const corpus = buildCorpus(file.text, resume);
  const keywords = analyzeKeywords(job, corpus);
  const jobTerms = job.keywords.map((k) => k.term);
  const ats = assessAts(file.text, file, resume, jobTerms);

  // Stage 2: comparison, experience and section review (parallel).
  const [matchStage, experienceStage, reviewStage] = await Promise.all([
    stage("Job match review", provider, (p) => {
      const { system, prompt } = prompts.matchReview(resume, job);
      return p.generateJSON({ name: "match_review", system, prompt, schema: MatchReviewSchema, maxTokens: 4000 });
    }, () => localMatchReview(job, corpus, keywords), notices),
    stage("Experience review", provider, (p) => {
      const { system, prompt } = prompts.experienceReview(resume, job);
      return p.generateJSON({ name: "experience_review", system, prompt, schema: ExperienceReviewSchema, maxTokens: 3000 });
    }, () => localExperienceReview(resume, job), notices),
    stage("Resume review", provider, (p) => {
      const { system, prompt } = prompts.resumeReview(resume, job, ats.issues.map((i) => i.title));
      return p.generateJSON({ name: "resume_review", system, prompt, schema: ResumeReviewSchema, maxTokens: 3000 });
    }, () => localResumeReview(resume, job, corpus), notices),
  ]);

  const match = matchStage.value;
  const expReview = experienceStage.value;
  const review = reviewStage.value;
  const requirements = match.requirements.length ? match.requirements : localMatchReview(job, corpus, keywords).requirements;
  const skills = analyzeSkills(job, corpus, matchStage.ai ? match : null);

  // Experience: deterministic bullet scoring + AI (or rule-based) suggestions guarded for invented facts.
  const experienceAnalysis: ExperienceAnalysis[] = resume.experience.slice(0, 6).map((role, index) => {
    const ai = expReview.roles.find((r) => r.roleIndex === index);
    const bullets = role.bullets.slice(0, 12).map((text, bi) => {
      const scored = scoreBullet(text, bi, jobTerms);
      const s = expReview.bullets.find((b) => b.roleIndex === index && b.bulletIndex === bi);
      if (s && findInventedFacts(s.suggestion, file.text).length === 0 && s.suggestion.trim() !== text.trim()) {
        return { ...scored, suggestion: s.suggestion, rationale: s.rationale };
      }
      if (scored.score < 70) {
        const local = localRewriteBullet(text);
        return { ...scored, suggestion: local.suggestion, rationale: local.rationale };
      }
      return scored;
    });
    const bulletQuality = bullets.length ? Math.round(bullets.reduce((s, b) => s + b.score, 0) / bullets.length) : 30;
    return {
      index,
      title: role.title,
      company: role.company,
      dates: [role.startDate, role.endDate].filter(Boolean).join(" - ") || null,
      matchPercent: Math.round(ai?.matchPercent ?? 40),
      strengths: ai?.strengths ?? [],
      weaknesses: ai?.weaknesses ?? [],
      relevantTechnologies: ai?.relevantTechnologies ?? [],
      missingEvidence: ai?.missingEvidence ?? [],
      suggestions: ai?.suggestions ?? [],
      bulletQuality,
      bullets,
    };
  });

  const sectionAnalysis = analyzeSections({ resume, job, roles: experienceAnalysis, atsScore: ats.score, review: reviewStage.ai ? review : null });

  const covered = (title: string) =>
    /keyword|certif|skill|tool/i.test(title) ||
    ats.issues.some((i) => i.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(i.title.toLowerCase()));
  for (const note of reviewStage.ai ? review.atsNotes : []) {
    if (covered(note.title)) continue;
    ats.issues.push({ id: `ai-${ats.issues.length}`, title: note.title, detail: note.detail, severity: note.severity });
  }

  const scores = combineScores({
    jobMatch: jobMatchScore(requirements),
    keyword: keywordScore(keywords.matched, keywords.underused, keywords.missing),
    skills: skillsScore([...skills.strong, ...skills.partial, ...skills.missing]),
    experience: experienceScore(experienceAnalysis, job.yearsOfExperience, estimateYears(resume.experience)),
    ats: ats.score,
    resumeQuality: resumeQualityScore(sectionAnalysis, experienceAnalysis),
  });

  const recommendations = buildRecommendations(review.recommendations, ats, skills.missing.map((s) => s.skill), experienceAnalysis, resume, file.text);
  // Use the AI summary only if it passes the integrity guard; otherwise fall back to the fact-only local draft.
  const localSummary = localResumeReview(resume, job, corpus).summary.suggested;
  const summarySuggested = [review.summary.suggested, localSummary].find((s) => s && findInventedFacts(s, file.text).length === 0) ?? null;

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    mode: provider ? "ai" : "local",
    notices,
    fileName,
    scores,
    summary: match.scoreExplanation,
    strengths: match.strengths.slice(0, 6),
    weaknesses: [...match.weaknesses].sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact]).slice(0, 6),
    matchedKeywords: keywords.matched,
    missingKeywords: keywords.missing,
    underusedKeywords: keywords.underused,
    skillsAnalysis: skills,
    experienceAnalysis,
    sectionAnalysis,
    atsIssues: ats.issues,
    ats,
    jobRequirements: requirements,
    recommendations,
    priorityActions: recommendations.slice(0, 5),
    resumeImprovements: {
      summary: { kind: "summary", original: resume.summary, suggested: summarySuggested, analysis: review.summary.analysis },
      skills: review.skillsAdvice,
    },
    readiness: buildReadiness(scores.overall, sectionAnalysis, experienceAnalysis, skills.missing, ats),
    jobInsights: job,
    resumeFacts: {
      summary: resume.summary,
      skills: resume.skills.slice(0, 80),
      experience: resume.experience.slice(0, 6).map((r) => ({ title: r.title, company: r.company, bullets: r.bullets.slice(0, 12) })),
    },
  };
}

function buildRecommendations(
  ai: { title: string; whatToChange: string; whyItMatters: string; section: Recommendation["section"]; impact: Impact }[],
  ats: ReturnType<typeof assessAts>,
  missingSkills: string[],
  roles: ExperienceAnalysis[],
  resume: ResumeData,
  resumeText: string,
): Recommendation[] {
  // Any recommendation that names a skill absent from the resume must say it's conditional.
  const recs: Omit<Recommendation, "id">[] = ai.map((r) => {
    const text = `${r.title} ${r.whatToChange}`;
    const mentionsAbsent =
      missingSkills.some((s) => containsTerm(text, s)) || findKnownTerms(text).some((t) => !containsTerm(resumeText, t));
    const hedged = /\b(if you|only if|genuinely|actually have|if held|if applicable)\b/i.test(text);
    return mentionsAbsent && !hedged ? { ...r, whatToChange: `${r.whatToChange} Only add this if you genuinely have this experience.` } : r;
  });

  if (recs.length < 4) {
    const weakBullets = roles.flatMap((r) => r.bullets).filter((b) => b.score < 60).length;
    if (weakBullets) recs.push({ title: "Strengthen weak experience bullets", whatToChange: `Rewrite ${weakBullets} low-scoring bullet(s) to lead with an action verb and describe the result.`, whyItMatters: "Recruiters skim bullets in seconds; specific, outcome-focused statements show impact.", section: "experience", impact: "high" });
    if (missingSkills.length) recs.push({ title: "Address missing required skills", whatToChange: `Where you genuinely have experience with ${missingSkills.slice(0, 3).join(", ")}, add a bullet showing how you used it. This should only be added if you actually have this experience.`, whyItMatters: "Required skills are often used as screening filters.", section: "skills", impact: "high" });
    if (!resume.summary) recs.push({ title: "Add a tailored professional summary", whatToChange: "Write 2-4 sentences positioning you for this role, using facts from your experience.", whyItMatters: "A summary frames how a recruiter reads the rest of the resume.", section: "summary", impact: "medium" });
  }
  for (const issue of ats.issues.filter((i) => i.severity !== "low").slice(0, 2)) {
    recs.push({ title: issue.title, whatToChange: issue.detail, whyItMatters: "Parsing problems can hide relevant experience from keyword searches.", section: "formatting", impact: issue.severity === "high" ? "high" : "medium" });
  }

  return uniqueBy(recs, (r) => r.title)
    .sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact])
    .slice(0, 8)
    .map((r, i) => ({ ...r, id: `rec-${i}` }));
}

function buildReadiness(
  overall: number,
  sections: ResumeAnalysis["sectionAnalysis"],
  roles: ExperienceAnalysis[],
  missingSkills: ResumeAnalysis["skillsAnalysis"]["missing"],
  ats: ReturnType<typeof assessAts>,
): Readiness {
  const summary = sections.find((s) => s.section === "summary");
  const avgBullet = roles.length ? roles.reduce((s, r) => s + r.bulletQuality, 0) / roles.length : 0;
  const requiredMissing = missingSkills.filter((s) => s.importance === "required");
  const seriousAts = ats.issues.filter((i) => i.severity !== "low");

  const checklist: Readiness["checklist"] = [
    { label: "Improve summary", done: (summary?.score ?? 0) >= 75, detail: summary?.present ? `Summary score ${summary.score}/100.` : "No summary yet." },
    { label: "Strengthen experience bullets", done: avgBullet >= 70, detail: `Average bullet quality ${Math.round(avgBullet)}/100.` },
    { label: "Address missing relevant skills", done: requiredMissing.length === 0, detail: requiredMissing.length ? `${requiredMissing.length} required skill(s) without evidence.` : "All required skills have some evidence." },
    { label: "Fix ATS formatting issues", done: seriousAts.length === 0, detail: seriousAts.length ? `${seriousAts.length} issue(s) to fix.` : "No major ATS compatibility issues detected." },
  ];
  const open = checklist.filter((c) => !c.done).length;
  const status = overall >= 80 && open <= 1 ? "Ready" : overall >= 65 && open <= 3 ? "Nearly Ready" : "Needs Improvement";
  return { status, checklist };
}

/** On-demand rewrite for the improvement workspace. */
export async function generateImprovement(req: ImproveRequest): Promise<ImprovementResponse & { mode: "ai" | "local" }> {
  const corpus = [req.resumeFacts.summary ?? "", req.resumeFacts.skills.join(", "), ...req.resumeFacts.experience.flatMap((r) => [r.title, r.company ?? "", ...r.bullets])].join("\n");

  if (!isAIConfigured()) {
    if (req.kind === "bullet") {
      const local = localRewriteBullet(req.original);
      return { mode: "local", suggestion: local.suggestion ?? req.original, rationale: local.rationale, analysis: [] };
    }
    throw new AppError("AI_NOT_CONFIGURED", "Summary rewriting needs an AI provider. Add AI_API_KEY to enable it.");
  }

  const provider = getProvider();
  const { system, prompt } = prompts.improvement(req);
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await provider.generateJSON({ name: "improvement", system, prompt: attempt ? `${prompt}\n\nYour last suggestion introduced facts that are not in the resume. Use only facts from resume_facts.` : prompt, schema: ImprovementResponseSchema, maxTokens: 1200, temperature: 0.6 });
    if (findInventedFacts(res.suggestion, corpus).length === 0) return { ...res, mode: "ai" };
  }
  throw new AppError("AI_MALFORMED", "We couldn't produce a suggestion that stays factually accurate. Try again or keep your original.");
}
