import type { ATSAnalysis, ATSIssue, ResumeData, Severity } from "@/lib/schemas";
import type { ExtractedDocument } from "@/lib/parsing/pdf";
import { looksLikeCustomHeading, splitSections } from "@/lib/parsing/resume-heuristics";
import { clamp, containsTerm } from "@/lib/text";

const PENALTY: Record<Severity, number> = { high: 18, medium: 9, low: 4 };

const DATE_FORMATS: [string, RegExp][] = [
  ["Mon YYYY", /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/gi],
  ["MM/YYYY", /\b\d{1,2}\/\d{4}\b/g],
  ["YYYY-MM", /\b\d{4}-\d{2}\b/g],
];

/** Deterministic ATS compatibility assessment. Not a simulation of any specific commercial ATS. */
export function assessAts(
  text: string,
  doc: Pick<ExtractedDocument, "signals" | "pageCount">,
  resume: ResumeData,
  jobKeywords: string[],
): ATSAnalysis {
  const issues: ATSIssue[] = [];
  const add = (id: string, severity: Severity, title: string, detail: string) => issues.push({ id, severity, title, detail });

  const sections = splitSections(text);
  const found = new Set(sections.map((s) => s.name));

  if (!found.has("experience")) add("missing-experience", "high", "No standard Experience heading", 'Use a clear heading such as "Experience" or "Work Experience" so parsers can locate your roles.');
  if (!found.has("skills")) add("missing-skills", "medium", "No dedicated Skills section", "A Skills section gives ATS keyword matching a reliable place to find your core competencies.");
  if (!found.has("education")) add("missing-education", "low", "No Education heading detected", 'If you have formal education, list it under a standard "Education" heading.');

  const custom = text.split("\n").filter((l) => looksLikeCustomHeading(l)).slice(0, 4);
  if (custom.length >= 2) add("custom-headings", "low", "Non-standard section headings", `Headings like "${custom.slice(0, 2).join('", "')}" may not be recognized. Prefer conventional names where they fit.`);

  if (!resume.email) add("no-email", "high", "Email address not readable", "We couldn't find an email in the extracted text. Make sure contact details are plain text, not inside an image or header graphic.");
  if (!resume.phone) add("no-phone", "low", "Phone number not detected", "Consider including a phone number in plain text near your name.");

  if (doc.signals.tables > 0) add("tables", doc.signals.tables > 2 ? "medium" : "low", "Tables detected", `Your document contains ${doc.signals.tables} table(s). Some parsers read tables out of order; simple single-column text is the safest.`);
  if (doc.signals.images > 0) add("images", "low", "Images or graphics detected", "Graphics, icons and photos are ignored by most parsers. Make sure no important information exists only inside images.");
  if (doc.signals.multiColumnSuspected) add("multi-column", "medium", "Possible multi-column layout", "Text order suggests multiple columns. Parsers may merge columns line by line, scrambling your content.");

  const formats = DATE_FORMATS.filter(([, re]) => (text.match(re) ?? []).length > 0).map(([n]) => n);
  if (formats.length > 1) add("date-format", "low", "Inconsistent date formatting", `Dates appear in multiple formats (${formats.join(", ")}). Pick one format and use it everywhere.`);

  const oddSymbols = (text.match(/[\u2605\u2606\u2713\u2714\u2716\u27a4\u2794\u25b6\u2665\u260e\u2709\ue000-\uf8ff]/g) ?? []).length;
  if (oddSymbols >= 3) add("symbols", "low", "Decorative symbols in text", "Icons and decorative characters can extract as garbage characters. Use plain text labels instead.");

  if (doc.pageCount > 3) add("length", "low", "Resume is longer than 3 pages", "Long resumes dilute keyword density and recruiter attention. Aim for 1-2 pages unless your field expects more.");

  const words = text.split(/\s+/).length;
  if (words < 200) add("thin", "medium", "Very little content", "The resume has under 200 words, which limits how many relevant keywords can be found.");

  const visible = jobKeywords.filter((k) => containsTerm(text, k)).length;
  const visibility = jobKeywords.length ? visible / jobKeywords.length : 1;
  if (jobKeywords.length >= 4 && visibility < 0.35) add("keyword-visibility", "medium", "Low keyword visibility", "Few of the job's key terms appear in plain text. Where you genuinely have the experience, use the same terminology as the posting.");

  const bulletCount = resume.experience.reduce((n, r) => n + r.bullets.length, 0);
  if (resume.experience.length > 0 && bulletCount === 0) add("no-bullets", "medium", "Experience lacks bullet points", "Dense paragraphs are harder to parse and scan. Break responsibilities into concise bullets.");

  const order = sections.map((s) => s.name).filter((n) => n === "education" || n === "experience");
  if (order[0] === "education" && resume.experience.length >= 2) add("ordering", "low", "Education listed before experience", "With multiple roles, leading with Experience usually works better for both parsers and recruiters.");

  const score = clamp(Math.round(100 - issues.reduce((s, i) => s + PENALTY[i.severity], 0)));
  const has = (id: string) => issues.some((i) => i.id === id);

  return {
    score,
    issues: issues.sort((a, b) => PENALTY[b.severity] - PENALTY[a.severity]),
    checks: [
      { label: "Standard section headings", passed: !has("missing-experience") && !has("custom-headings") },
      { label: "Readable contact information", passed: !has("no-email") },
      { label: "Single-column, table-free layout", passed: !has("tables") && !has("multi-column") },
      { label: "Consistent date formatting", passed: !has("date-format") },
      { label: "No decorative symbols or graphics", passed: !has("symbols") && !has("images") },
      { label: "Job keywords visible in plain text", passed: !has("keyword-visibility") },
    ],
  };
}
