import { z } from "zod";

/* ----------------------------- Shared enums ----------------------------- */

export const ImportanceSchema = z.enum(["required", "preferred", "nice"]);
export const ImpactSchema = z.enum(["high", "medium", "low"]);
export const MatchLevelSchema = z.enum(["strong", "partial", "gap"]);
export const SeveritySchema = z.enum(["high", "medium", "low"]);
export const KeywordCategorySchema = z.enum([
  "hard_skill",
  "tool",
  "domain",
  "soft_skill",
  "certification",
  "other",
]);
export const SenioritySchema = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "manager",
  "director",
  "unknown",
]);
export const SectionKeySchema = z.enum([
  "summary",
  "experience",
  "skills",
  "education",
  "projects",
  "certifications",
  "formatting",
]);

export type Importance = z.infer<typeof ImportanceSchema>;
export type Impact = z.infer<typeof ImpactSchema>;
export type MatchLevel = z.infer<typeof MatchLevelSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type KeywordCategory = z.infer<typeof KeywordCategorySchema>;
export type Seniority = z.infer<typeof SenioritySchema>;
export type SectionKey = z.infer<typeof SectionKeySchema>;

/** AI-facing field helpers: models sometimes omit optional fields, so default them instead of failing. */
const nullableString = z.string().nullable().default(null);
const strings = () => z.array(z.string()).default([]);

/* ------------------------------ Resume data ----------------------------- */

export const ExperienceEntrySchema = z.object({
  title: z.string(),
  company: nullableString,
  location: nullableString,
  startDate: nullableString,
  endDate: nullableString,
  bullets: strings(),
});

export const ResumeDataSchema = z.object({
  name: nullableString,
  email: nullableString,
  phone: nullableString,
  location: nullableString,
  linkedin: nullableString,
  portfolio: nullableString,
  summary: nullableString,
  experience: z.array(ExperienceEntrySchema),
  education: z.array(
    z.object({ degree: z.string(), institution: nullableString, year: nullableString }),
  ),
  skills: strings(),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: strings(),
    }),
  ),
  certifications: strings(),
  awards: strings(),
});

export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;

/* -------------------------------- Job data ------------------------------ */

export const JobKeywordSchema = z.object({
  term: z.string(),
  importance: ImportanceSchema,
  category: KeywordCategorySchema,
  whyItMatters: z.string(),
  aliases: strings(),
});

export const JobDataSchema = z.object({
  title: z.string(),
  seniority: SenioritySchema,
  company: nullableString,
  requiredSkills: strings(),
  preferredSkills: strings(),
  responsibilities: strings(),
  educationRequirements: strings(),
  experienceRequirements: strings(),
  yearsOfExperience: z.number().nullable(),
  certifications: strings(),
  tools: strings(),
  domainKeywords: strings(),
  softSkills: strings(),
  keywords: z.array(JobKeywordSchema),
  recruiterPriorities: z.array(z.object({ priority: z.string(), rationale: z.string() })),
  confidence: z.number().min(0).max(1),
});

export type JobKeyword = z.infer<typeof JobKeywordSchema>;
export type JobData = z.infer<typeof JobDataSchema>;

/* -------------------------- AI review responses ------------------------- */

export const MatchReviewSchema = z.object({
  requirements: z.array(
    z.object({
      requirement: z.string(),
      importance: ImportanceSchema,
      level: MatchLevelSchema,
      evidence: nullableString,
      note: z.string(),
    }),
  ),
  skills: z.array(
    z.object({
      skill: z.string(),
      level: MatchLevelSchema,
      evidence: nullableString,
      explanation: z.string(),
    }),
  ),
  strengths: z.array(z.object({ title: z.string(), detail: z.string() })),
  weaknesses: z.array(z.object({ title: z.string(), detail: z.string(), impact: ImpactSchema })),
  scoreExplanation: z.string(),
});
export type MatchReview = z.infer<typeof MatchReviewSchema>;

export const ExperienceReviewSchema = z.object({
  roles: z.array(
    z.object({
      roleIndex: z.number().int(),
      matchPercent: z.number().min(0).max(100),
      strengths: strings(),
      weaknesses: strings(),
      relevantTechnologies: strings(),
      missingEvidence: strings(),
      suggestions: strings(),
    }),
  ),
  bullets: z.array(
    z.object({
      roleIndex: z.number().int(),
      bulletIndex: z.number().int(),
      suggestion: z.string(),
      rationale: z.string(),
    }),
  ),
});
export type ExperienceReview = z.infer<typeof ExperienceReviewSchema>;

export const SkillsAdviceSchema = z.object({
  emphasize: strings(),
  reorder: strings(),
  buried: strings(),
  doNotAddUnlessTrue: strings(),
  notes: z.string(),
});
export type SkillsAdvice = z.infer<typeof SkillsAdviceSchema>;

export const ResumeReviewSchema = z.object({
  sections: z.array(
    z.object({
      section: SectionKeySchema,
      strengths: strings(),
      issues: strings(),
      recommendations: strings(),
    }),
  ),
  atsNotes: z.array(z.object({ title: z.string(), detail: z.string(), severity: SeveritySchema })),
  recommendations: z.array(
    z.object({
      title: z.string(),
      whatToChange: z.string(),
      whyItMatters: z.string(),
      section: SectionKeySchema,
      impact: ImpactSchema,
    }),
  ),
  summary: z.object({ analysis: strings(), suggested: nullableString }),
  skillsAdvice: SkillsAdviceSchema,
});
export type ResumeReview = z.infer<typeof ResumeReviewSchema>;

export const ImprovementResponseSchema = z.object({
  suggestion: z.string(),
  rationale: z.string(),
  analysis: strings(),
});
export type ImprovementResponse = z.infer<typeof ImprovementResponseSchema>;

/* ---------------------------- Final analysis ---------------------------- */

export type ScoreLabel =
  | "Excellent Match"
  | "Strong Match"
  | "Good Match"
  | "Moderate Match"
  | "Needs Improvement";

export interface ScoreBreakdown {
  overall: number;
  ats: number;
  jobMatch: number;
  keyword: number;
  skills: number;
  experience: number;
  resumeQuality: number;
  label: ScoreLabel;
  weights: Record<"jobMatch" | "keyword" | "skills" | "experience" | "ats" | "resumeQuality", number>;
}

export interface KeywordMatch {
  term: string;
  importance: Importance;
  category: KeywordCategory;
  count: number;
  inExperience: boolean;
  whyItMatters: string;
  /** true when the resume contains related evidence (e.g. an alias), making it safe to phrase naturally */
  hasRelatedEvidence: boolean;
}

export interface SkillMatch {
  skill: string;
  importance: Importance;
  level: MatchLevel;
  coverage: number;
  evidence: string | null;
  explanation: string;
}

export interface RequirementMatch {
  requirement: string;
  importance: Importance;
  level: MatchLevel;
  evidence: string | null;
  note: string;
}

export type CriterionRating = "strong" | "good" | "weak" | "missing";

export interface BulletAnalysis {
  index: number;
  text: string;
  score: number;
  criteria: {
    actionVerb: CriterionRating;
    technicalDetail: CriterionRating;
    clarity: CriterionRating;
    impact: CriterionRating;
    metric: CriterionRating;
    relevance: CriterionRating;
  };
  suggestion: string | null;
  rationale: string | null;
}

export interface ExperienceAnalysis {
  index: number;
  title: string;
  company: string | null;
  dates: string | null;
  matchPercent: number;
  strengths: string[];
  weaknesses: string[];
  relevantTechnologies: string[];
  missingEvidence: string[];
  suggestions: string[];
  bulletQuality: number;
  bullets: BulletAnalysis[];
}

export interface SectionAnalysis {
  section: SectionKey;
  present: boolean;
  required: boolean;
  score: number | null;
  strengths: string[];
  issues: string[];
  recommendations: string[];
}

export interface ATSIssue {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
}

export interface ATSAnalysis {
  score: number;
  issues: ATSIssue[];
  checks: { label: string; passed: boolean }[];
}

export interface Recommendation {
  id: string;
  title: string;
  whatToChange: string;
  whyItMatters: string;
  section: SectionKey;
  impact: Impact;
}

export interface ImprovementSuggestion {
  kind: "summary" | "bullet";
  original: string | null;
  suggested: string | null;
  analysis: string[];
  roleIndex?: number;
  bulletIndex?: number;
}

export type ReadinessStatus = "Ready" | "Nearly Ready" | "Needs Improvement";

export interface Readiness {
  status: ReadinessStatus;
  checklist: { label: string; done: boolean; detail: string }[];
}

export interface ResumeAnalysis {
  id: string;
  createdAt: string;
  mode: "ai" | "local";
  /** User-facing notes, e.g. when an AI stage fell back to local analysis. */
  notices: string[];
  fileName: string;
  scores: ScoreBreakdown;
  summary: string;
  strengths: { title: string; detail: string }[];
  weaknesses: { title: string; detail: string; impact: Impact }[];
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  underusedKeywords: KeywordMatch[];
  skillsAnalysis: { strong: SkillMatch[]; partial: SkillMatch[]; missing: SkillMatch[] };
  experienceAnalysis: ExperienceAnalysis[];
  sectionAnalysis: SectionAnalysis[];
  atsIssues: ATSIssue[];
  ats: ATSAnalysis;
  jobRequirements: RequirementMatch[];
  recommendations: Recommendation[];
  priorityActions: Recommendation[];
  resumeImprovements: {
    summary: ImprovementSuggestion;
    skills: SkillsAdvice;
  };
  readiness: Readiness;
  jobInsights: JobData;
  /** Minimal resume facts needed for the improvement workspace. Never the full raw text. */
  resumeFacts: {
    summary: string | null;
    skills: string[];
    experience: { title: string; company: string | null; bullets: string[] }[];
  };
}

/* ------------------------------ API inputs ------------------------------ */

export const ImproveRequestSchema = z.object({
  kind: z.enum(["bullet", "summary"]),
  original: z.string().max(4000),
  previousSuggestion: z.string().max(4000).nullable().optional(),
  jobTitle: z.string().max(300),
  jobKeywords: z.array(z.string().max(100)).max(60),
  resumeFacts: z.object({
    summary: z.string().max(4000).nullable(),
    skills: z.array(z.string().max(120)).max(200),
    experience: z
      .array(
        z.object({
          title: z.string().max(300),
          company: z.string().max(300).nullable(),
          bullets: z.array(z.string().max(1500)).max(60),
        }),
      )
      .max(30),
  }),
});
export type ImproveRequest = z.infer<typeof ImproveRequestSchema>;
