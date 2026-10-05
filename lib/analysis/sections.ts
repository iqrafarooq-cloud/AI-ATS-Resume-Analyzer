import type { ExperienceAnalysis, JobData, ResumeData, ResumeReview, SectionAnalysis, SectionKey } from "@/lib/schemas";
import { clamp, containsTerm, wordCount } from "@/lib/text";

interface SectionContext {
  resume: ResumeData;
  job: JobData;
  roles: ExperienceAnalysis[];
  atsScore: number;
  review: ResumeReview | null;
}

const ORDER: SectionKey[] = ["summary", "experience", "skills", "education", "projects", "certifications", "formatting"];

function jobTermHits(text: string, job: JobData): number {
  return job.keywords.filter((k) => containsTerm(text, k.term)).length;
}

/** Deterministic section scores, enriched with AI commentary when available. */
export function analyzeSections({ resume, job, roles, atsScore, review }: SectionContext): SectionAnalysis[] {
  const aiBySection = new Map((review?.sections ?? []).map((s) => [s.section, s]));
  const jobSkills = [...job.requiredSkills, ...job.preferredSkills];
  const skillsText = resume.skills.join(", ");
  const isEarlyCareer = ["intern", "junior"].includes(job.seniority);

  const base = (section: SectionKey): Omit<SectionAnalysis, "section"> => {
    switch (section) {
      case "summary": {
        if (!resume.summary) {
          return { present: false, required: false, score: null, strengths: [], issues: ["No professional summary found."], recommendations: ["Add a 2-4 sentence summary that positions you for this role using facts from your experience."] };
        }
        const words = wordCount(resume.summary);
        const hits = jobTermHits(resume.summary, job);
        const score = clamp(40 + Math.min(40, hits * 10) + (words >= 25 && words <= 90 ? 20 : 5));
        return {
          present: true,
          required: false,
          score,
          strengths: hits >= 2 ? [`References ${hits} terms from the job description.`] : [],
          issues: [...(hits < 2 ? ["Doesn't reflect the target role's key requirements."] : []), ...(words > 90 ? ["Too long to scan quickly."] : words < 25 ? ["Very short, so it may come across as generic."] : [])],
          recommendations: hits < 2 ? ["Tailor the summary to the target role using skills you genuinely have."] : [],
        };
      }
      case "experience": {
        if (roles.length === 0) {
          return { present: false, required: true, score: 10, strengths: [], issues: ["No experience entries could be identified."], recommendations: ["Add an Experience section with role, company, dates and bullet points."] };
        }
        const quality = Math.round(roles.reduce((s, r) => s + r.bulletQuality, 0) / roles.length);
        const metricBullets = roles.flatMap((r) => r.bullets).filter((b) => b.criteria.metric === "strong").length;
        const total = roles.flatMap((r) => r.bullets).length;
        return {
          present: true,
          required: true,
          score: quality,
          strengths: [`${roles.length} role${roles.length === 1 ? "" : "s"} with ${total} bullet points identified.`],
          issues: metricBullets < Math.ceil(total / 4) ? [`Only ${metricBullets} of ${total} bullets include a measurable result.`] : [],
          recommendations: metricBullets < Math.ceil(total / 4) ? ["Consider adding a metric where you have one (time saved, scale, quality improvements)."] : [],
        };
      }
      case "skills": {
        if (resume.skills.length === 0) {
          return { present: false, required: true, score: 30, strengths: [], issues: ["No skills list detected."], recommendations: ["Add a Skills section listing the tools and technologies you actually use."] };
        }
        const listed = jobSkills.filter((s) => containsTerm(skillsText, s)).length;
        const ratio = jobSkills.length ? listed / jobSkills.length : 0.6;
        return {
          present: true,
          required: true,
          score: clamp(Math.round(45 + ratio * 55)),
          strengths: listed ? [`Lists ${listed} of ${jobSkills.length} skills named in the posting.`] : [],
          issues: ratio < 0.5 && jobSkills.length ? ["Many of the job's skills are not in your skills list."] : [],
          recommendations: ratio < 0.5 ? ["Move your most relevant skills to the front and add any job skills you genuinely have."] : [],
        };
      }
      case "education": {
        const needed = job.educationRequirements.length > 0;
        if (resume.education.length === 0) {
          return needed
            ? { present: false, required: true, score: 35, strengths: [], issues: ["The job lists education requirements but no Education section was found."], recommendations: ["Add your education under a standard Education heading."] }
            : { present: false, required: false, score: null, strengths: [], issues: [], recommendations: [] };
        }
        return { present: true, required: needed, score: 85, strengths: ["Education section is present."], issues: [], recommendations: [] };
      }
      case "projects": {
        if (resume.projects.length === 0) {
          return { present: false, required: false, score: null, strengths: [], issues: [], recommendations: isEarlyCareer ? ["For early-career roles, relevant projects can demonstrate skills you haven't used professionally."] : [] };
        }
        const hits = jobTermHits(resume.projects.map((p) => `${p.name} ${p.description} ${p.technologies.join(" ")}`).join(" "), job);
        return { present: true, required: false, score: clamp(55 + hits * 8), strengths: hits ? [`Projects use ${hits} job-relevant terms.`] : [], issues: hits ? [] : ["Projects don't clearly relate to the target role."], recommendations: [] };
      }
      case "certifications": {
        const needed = job.certifications.length > 0;
        if (resume.certifications.length === 0) {
          return needed
            ? { present: false, required: true, score: 40, strengths: [], issues: [`The posting mentions ${job.certifications.join(", ")}.`], recommendations: ["List relevant certifications only if you hold them."] }
            : { present: false, required: false, score: null, strengths: [], issues: [], recommendations: [] };
        }
        const matching = job.certifications.filter((c) => resume.certifications.some((rc) => containsTerm(rc, c))).length;
        return { present: true, required: needed, score: clamp(70 + matching * 15), strengths: [`${resume.certifications.length} certification(s) listed.`], issues: [], recommendations: [] };
      }
      case "formatting":
        return { present: true, required: true, score: atsScore, strengths: atsScore >= 85 ? ["Clean, parser-friendly structure."] : [], issues: [], recommendations: [] };
    }
  };

  return ORDER.map((section) => {
    const b = base(section);
    const ai = aiBySection.get(section);
    if (!ai) return { section, ...b };
    // A legitimately absent, non-required section keeps a neutral state even if the AI comments on it.
    const keepNeutral = !b.present && !b.required;
    return {
      section,
      ...b,
      strengths: ai.strengths.length ? ai.strengths : b.strengths,
      issues: keepNeutral ? b.issues : ai.issues.length ? ai.issues : b.issues,
      recommendations: ai.recommendations.length ? ai.recommendations : b.recommendations,
    };
  });
}
