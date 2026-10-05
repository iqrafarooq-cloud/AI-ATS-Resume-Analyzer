import { STANDARD_HEADINGS } from "@/lib/analysis/dictionary";
import type { ResumeData } from "@/lib/schemas";
import { findKnownTerms, uniqueBy } from "@/lib/text";

export type ResumeSectionName = keyof typeof STANDARD_HEADINGS | "header" | "other";

export interface ResumeSection {
  name: ResumeSectionName;
  heading: string;
  lines: string[];
}

const BULLET_RE = /^(?:[\u2022*\-\u00b7>o]|\d+[.)])\s+/;
const DATE_RANGE_RE =
  /((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*(-|to|until)\s*((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current|now)/i;

export function classifyHeading(line: string): ResumeSectionName | null {
  const clean = line.replace(/[:|_]+$/g, "").replace(/\s+/g, " ").trim();
  if (clean.length === 0 || clean.length > 45 || /[.@]/.test(clean)) return null;
  for (const [name, re] of Object.entries(STANDARD_HEADINGS)) {
    if (re.test(clean)) return name as ResumeSectionName;
  }
  return null;
}

/** Lines that look like a heading (short, uppercase) but aren't a recognized standard section. */
export function looksLikeCustomHeading(line: string): boolean {
  const clean = line.trim();
  return (
    clean.length >= 3 &&
    clean.length <= 30 &&
    clean === clean.toUpperCase() &&
    /^[A-Z &/]+$/.test(clean) &&
    classifyHeading(clean) === null
  );
}

export function splitSections(text: string): ResumeSection[] {
  const sections: ResumeSection[] = [{ name: "header", heading: "", lines: [] }];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const name = classifyHeading(line);
    if (name) {
      sections.push({ name, heading: line.trim(), lines: [] });
    } else if (looksLikeCustomHeading(line) && sections.length > 1) {
      sections.push({ name: "other", heading: line.trim(), lines: [] });
    } else {
      sections[sections.length - 1].lines.push(line.trim());
    }
  }
  return sections;
}

export function isBullet(line: string): boolean {
  return BULLET_RE.test(line);
}

export function stripBullet(line: string): string {
  return line.replace(BULLET_RE, "").trim();
}

function sectionLines(sections: ResumeSection[], name: ResumeSectionName): string[] {
  return sections.filter((s) => s.name === name).flatMap((s) => s.lines);
}

function parseExperience(lines: string[]): ResumeData["experience"] {
  const roles: ResumeData["experience"] = [];
  let current: ResumeData["experience"][number] | null = null;
  let pendingHeader: string[] = [];

  const startRole = (headerLines: string[]) => {
    const joined = headerLines.join(" | ");
    const date = joined.match(DATE_RANGE_RE);
    const parts = headerLines
      .flatMap((l) => l.split(/\s+[|@\u2022]\s+|\s+-\s+|,\s+(?=[A-Z])/))
      .map((p) => p.replace(DATE_RANGE_RE, "").trim())
      .filter((p) => p.length > 1);
    current = {
      title: parts[0] ?? "Role",
      company: parts[1] ?? null,
      location: null,
      startDate: date ? date[1] : null,
      endDate: date ? date[4] : null,
      bullets: [],
    };
    roles.push(current);
  };

  // Date ranges anchor role headers. Everything else inside a role is a bullet, whether or not
  // it kept its bullet marker (DOCX list items arrive without one).
  const looksLikeHeaderLine = (line: string) => !isBullet(line) && line.length <= 70 && !/[.;]$/.test(line);

  for (const line of lines) {
    if (DATE_RANGE_RE.test(line) && !isBullet(line)) {
      const header = [line];
      const withoutDate = line.replace(DATE_RANGE_RE, "").replace(/[|,\s-]+$/g, "").trim();
      // "Title\nCompany | Mar 2021 - Present": pull the preceding short line back into the header.
      const c = current as ResumeData["experience"][number] | null;
      const prev = pendingHeader.length ? pendingHeader[pendingHeader.length - 1] : c?.bullets[c.bullets.length - 1];
      if (prev && looksLikeHeaderLine(prev) && withoutDate.split(/\s+[|@•]\s+/).length < 2) {
        if (pendingHeader.length) pendingHeader.pop();
        else c?.bullets.pop();
        header.unshift(prev);
      }
      startRole([...pendingHeader, ...header]);
      pendingHeader = [];
      continue;
    }
    const role = current as ResumeData["experience"][number] | null;
    if (role && role.bullets.length && !isBullet(line) && /^[a-z(&]/.test(line)) {
      // Wrapped continuation of the previous bullet.
      role.bullets[role.bullets.length - 1] += ` ${line}`;
    } else if (role) role.bullets.push(stripBullet(line));
    else if (isBullet(line)) {
      startRole(pendingHeader.length ? pendingHeader : ["Role"]);
      pendingHeader = [];
      (current as unknown as ResumeData["experience"][number]).bullets.push(stripBullet(line));
    } else pendingHeader.push(line);
  }
  return roles.filter((r) => r.bullets.length > 0 || r.startDate);
}

/** Deterministic resume extraction used in local mode and as a fallback. */
export function extractResumeHeuristic(text: string): ResumeData {
  const sections = splitSections(text);
  const header = sections[0].lines;

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? null;
  const phone = text.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] ?? null;
  const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0] ?? null;
  const portfolio =
    text.match(/(https?:\/\/)?(www\.)?(github\.com\/[\w-]+|[\w-]+\.(dev|io|me|com)\/?[\w-]*)/i)?.[0] ?? null;
  const name = header.find((l) => /^[A-Z][a-zA-Z'-]+(\s+[A-Z][a-zA-Z'.-]+){1,3}$/.test(l)) ?? null;
  const location =
    header.map((l) => l.match(/\b([A-Z][a-zA-Z. ]+,\s*[A-Z]{2}|[A-Z][a-zA-Z ]+,\s*[A-Z][a-zA-Z]+)\b/)?.[0]).find(Boolean) ?? null;

  const summaryLines = sectionLines(sections, "summary");
  const skillLines = sectionLines(sections, "skills");
  const skills = uniqueBy(
    skillLines
      .flatMap((l) => l.replace(/^[^:]{1,30}:\s*/, "").split(/[,;|\u2022]/))
      .map((s) => stripBullet(s).trim())
      .filter((s) => s.length > 1 && s.length < 40),
    (s) => s,
  );

  const projects = sectionLines(sections, "projects");
  const projectEntries: ResumeData["projects"] = [];
  for (const line of projects) {
    if (!isBullet(line) && line.length < 80) {
      projectEntries.push({ name: line, description: "", technologies: [] });
    } else if (projectEntries.length) {
      const p = projectEntries[projectEntries.length - 1];
      p.description = `${p.description} ${stripBullet(line)}`.trim();
    }
  }
  for (const p of projectEntries) p.technologies = findKnownTerms(`${p.name} ${p.description}`);

  return {
    name,
    email,
    phone,
    location,
    linkedin,
    portfolio: portfolio && !/linkedin/i.test(portfolio) && portfolio !== email ? portfolio : null,
    summary: summaryLines.length ? summaryLines.join(" ") : null,
    experience: parseExperience(sectionLines(sections, "experience")),
    education: sectionLines(sections, "education")
      .filter((l) => !isBullet(l))
      .slice(0, 4)
      .map((l) => ({ degree: l, institution: null, year: l.match(/\b(19|20)\d{2}\b/)?.[0] ?? null })),
    skills,
    projects: projectEntries.filter((p) => p.description || p.name).slice(0, 8),
    certifications: sectionLines(sections, "certifications").map(stripBullet).slice(0, 10),
    awards: sectionLines(sections, "awards").map(stripBullet).slice(0, 10),
  };
}
