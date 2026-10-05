import type { ImproveRequest, JobData, ResumeData } from "@/lib/schemas";

export const FACTUAL_INTEGRITY = `FACTUAL INTEGRITY RULES (critical, never break them):
- Never invent experience, employers, job titles, certifications, degrees, projects, achievements or responsibilities.
- Never invent technologies or tools the resume does not mention.
- Never invent metrics, numbers, percentages, team sizes or years of experience. If a metric would help, say "Consider adding a metric if you have one."
- Never give the candidate the target job's title or seniority (e.g. "Senior") unless their resume already shows it. Describe them by the titles they actually held.
- Never claim soft skills, mentoring or leadership the resume does not describe.
- Only rephrase and restructure information that is actually present in the resume.
- When a skill is genuinely absent, say it should only be added if the candidate actually has that experience.
- Do not recommend keyword stuffing.`;

const ANALYST = `You are ResumePilot, a meticulous senior technical recruiter and resume analyst. You are precise, specific and evidence-based. You never give generic advice: every statement must reference concrete content from the resume or the job description.
WRITING STYLE: Write for the job seeker in plain, friendly English, the way a helpful recruiter would talk. Address them as "you" and say "your resume", never "the candidate". Keep sentences short and specific. Avoid buzzwords and filler such as "leverage", "robust", "showcase", "demonstrates a strong". Do not use em dashes.`;

const fence = (label: string, content: string) => `<${label}>\n${content}\n</${label}>`;

export const prompts = {
  resumeExtraction(resumeText: string) {
    return {
      system: `${ANALYST}\nTask: extract structured data from a resume. Copy text faithfully; do not summarize bullets or fix facts. Use null for anything not present. Do not assume every section exists.`,
      prompt: `Extract the resume below. Keep each experience bullet as written (you may trim leading bullet symbols). List skills exactly as the candidate lists them.\n\n${fence("resume", resumeText)}`,
    };
  },

  jobExtraction(jobText: string) {
    return {
      system: `${ANALYST}\nTask: analyze a job description and extract structured hiring requirements. Separate required from preferred qualifications based on the wording. recruiterPriorities are your inference of what the hiring team cares about most - base each on specific wording.`,
      prompt: `Extract the job description below.
- keywords: 12-30 of the most important ATS terms (hard skills, tools, domain terms, certifications, key soft skills). Use the posting's own spelling for "term"; put common variants in "aliases". "whyItMatters" must be one specific sentence tied to this posting.
- When the posting offers alternatives ("Playwright, Selenium or Cypress", "Postman or similar"), mark each alternative "preferred" - the candidate only needs one of them. Put only skills the posting truly demands in requiredSkills.
- Domain or company context terms (e.g. "payments platform") are "nice" unless the posting explicitly requires domain experience.
- confidence: 0-1, how clearly the posting states its requirements.

${fence("job_description", jobText)}`,
    };
  },

  matchReview(resume: ResumeData, job: JobData) {
    return {
      system: `${ANALYST}\nTask: compare a candidate's resume against a job's requirements. Judge only from evidence in the resume.\n${FACTUAL_INTEGRITY}`,
      prompt: `Compare the resume with the job.
- requirements: the 6-12 most important requirements (skills, responsibilities, experience, education). level: "strong" = clearly demonstrated, "partial" = related or briefly mentioned, "gap" = no evidence. "evidence" is a short quote from the resume or null. "note" explains the judgment in one sentence.
- skills: one entry per skill in requiredSkills and preferredSkills, same level rules.
- strengths: 3-6 strongest findings, each specific to this resume and job.
- weaknesses: 3-6 most important issues ordered by impact.
- scoreExplanation: 2-3 sentences spoken directly to the job seeker (start with "Your resume"), explaining why it does or doesn't fit this job and naming specifics.

${fence("job", JSON.stringify(job))}
${fence("resume", JSON.stringify(resume))}`,
    };
  },

  experienceReview(resume: ResumeData, job: JobData) {
    return {
      system: `${ANALYST}\nTask: evaluate each experience entry against the target job and improve the weakest relevant bullets.\n${FACTUAL_INTEGRITY}`,
      prompt: `For each role in resume.experience (roleIndex = array index, max 6 roles):
- matchPercent: 0-100 relevance of the role to the target job.
- strengths, weaknesses, missingEvidence (job requirements this role could plausibly show but doesn't), suggestions: 1-3 short items each.
- relevantTechnologies: only technologies named in that role.

bullets: pick up to 10 bullets across roles that would benefit most from rewording (bulletIndex = index in that role's bullets). "suggestion" rewrites the bullet using only facts in it and the same role: stronger action verb, clearer scope, job terminology only when the original supports it. No new numbers or tools. "rationale": one sentence on what changed and, if no metric exists, "Consider adding a metric if you have one."

${fence("job", JSON.stringify({ title: job.title, requiredSkills: job.requiredSkills, preferredSkills: job.preferredSkills, responsibilities: job.responsibilities }))}
${fence("resume_experience", JSON.stringify(resume.experience.slice(0, 6)))}`,
    };
  },

  resumeReview(resume: ResumeData, job: JobData, atsFindings: string[]) {
    return {
      system: `${ANALYST}\nTask: review resume sections, ATS compatibility and produce a prioritized action plan. Use the phrase "ATS compatibility" - never claim to know exactly how a specific commercial ATS scores.\n${FACTUAL_INTEGRITY}`,
      prompt: `Review the resume for the target job.
- sections: one entry for each of summary, experience, skills, education, projects, certifications, formatting. 1-3 items per list. If a section is absent and not needed for this job, say so instead of penalizing it.
- atsNotes: up to 4 ATS compatibility concerns NOT already covered by these automated findings: ${JSON.stringify(atsFindings)}. Examples: inconsistent job titles, unclear section order, acronyms without full forms. Empty array if none.
- recommendations: the 5-7 changes that would most improve this application, ranked by impact. "whatToChange" must be concrete (name the bullet, section or skill). Prefer improving how existing experience is presented. When a recommendation involves a skill, tool, certification or responsibility not in the resume, phrase it conditionally ("If you have hands-on experience with X, ...").
- summary: "analysis" = 2-4 observations about the current professional summary (or its absence). "suggested" = a truthful 2-4 sentence summary for this job built only from facts in the resume (no invented years, achievements or technologies), or null if there isn't enough information.
- skillsAdvice: emphasize = resume skills most relevant to this job; reorder = skills to move to the front, in order; buried = relevant skills found in experience bullets but missing from the skills list; doNotAddUnlessTrue = job skills absent from the resume; notes = one sentence.

${fence("job", JSON.stringify(job))}
${fence("resume", JSON.stringify(resume))}`,
    };
  },

  improvement(req: ImproveRequest) {
    const facts = JSON.stringify(req.resumeFacts);
    const isBullet = req.kind === "bullet";
    return {
      system: `${ANALYST}\nTask: rewrite one piece of resume content for a target job while preserving factual meaning.\n${FACTUAL_INTEGRITY}`,
      prompt: `Target job: ${req.jobTitle}
Relevant job terms (use only if the original or resume facts support them): ${req.jobKeywords.join(", ")}

${fence("resume_facts", facts)}
${fence(isBullet ? "original_bullet" : "original_summary", req.original || "(none)")}
${req.previousSuggestion ? fence("previous_suggestion", `${req.previousSuggestion}\nWrite a meaningfully different alternative.`) : ""}

Return:
- suggestion: ${isBullet ? "one improved bullet (single sentence, starts with a strong past-tense action verb, no trailing period)" : "a 2-4 sentence professional summary aligned with the target job"}.
- rationale: one sentence on what changed and why.
- analysis: 2-4 short observations about the original.`,
    };
  },
};
