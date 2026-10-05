import { CASE_SENSITIVE_TERMS, TERMS, WEAK_ALIASES } from "@/lib/analysis/dictionary";

/** Normalize extracted document text while keeping line structure for section detection. */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[\u2022\u25cf\u25aa\u25a0\u2023\u2043\u2219\uf0b7\uf0a7\u27a2\u2756\u25e6]/g, "\u2022")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\ufb01/g, "fi")
    .replace(/\ufb02/g, "fl")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a regex that matches a term on word-ish boundaries (handles C++, C#, .NET, CI/CD). */
export function termRegex(term: string, flags = "gi"): RegExp {
  const caseSensitive = CASE_SENSITIVE_TERMS.has(term) || term.length <= 2;
  const f = caseSensitive ? flags.replace("i", "") : flags;
  return new RegExp(`(?<![A-Za-z0-9+#.])${escapeRegExp(term)}(?![A-Za-z0-9+#])`, f);
}

export function countOccurrences(text: string, term: string): number {
  return text.match(termRegex(term))?.length ?? 0;
}

export function containsTerm(text: string, term: string): boolean {
  return termRegex(term, "i").test(text);
}

const termIndex = new Map(TERMS.map((t) => [t.term.toLowerCase(), t]));

export function lookupTerm(term: string) {
  return termIndex.get(term.toLowerCase());
}

export function aliasesFor(term: string): string[] {
  return (lookupTerm(term)?.aliases ?? []).filter((a) => !WEAK_ALIASES.has(a));
}

/** Find dictionary terms present in a text. */
export function findKnownTerms(text: string): string[] {
  return TERMS.filter(
    (t) => containsTerm(text, t.term) || aliasesFor(t.term).some((a) => containsTerm(text, a)),
  ).map((t) => t.term);
}

/** Pick the sentence/line from `text` that best evidences `term`. */
export function findEvidence(lines: string[], terms: string[]): string | null {
  for (const line of lines) {
    if (terms.some((t) => containsTerm(line, t))) {
      return line.length > 220 ? `${line.slice(0, 217)}...` : line;
    }
  }
  return null;
}

export function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item).toLowerCase().trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function clamp(n: number, min = 0, max = 100): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Strip control characters and cap length. Rendering always goes through React text nodes. */
export function sanitizeText(value: string, max = 20000): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max);
}
