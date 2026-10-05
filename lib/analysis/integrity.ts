import { aliasesFor, containsTerm, findKnownTerms } from "@/lib/text";

const SENIORITY_WORDS = ["senior", "lead", "principal", "staff", "head", "manager", "director", "architect", "expert", "veteran"];
const CLAIM_PHRASES = [/\bmentor(ed|ing|ship)?\b/i, /\bmanag(ed|ing)\s+(a\s+)?team\b/i, /\bled\b/i, /\bspearheaded\b/i];

/**
 * Factual-integrity guard for generated rewrites. Flags numbers, years of experience,
 * seniority claims, leadership claims and known skills that appear in the suggestion
 * but nowhere in the candidate's own resume content.
 */
export function findInventedFacts(suggestion: string, sourceCorpus: string): string[] {
  const problems: string[] = [];

  for (const n of suggestion.match(/\d+(?:[.,]\d+)?/g) ?? []) {
    const re = new RegExp(`(?<![\\d.,])${n.replace(/[.,]/g, "[.,]")}(?![\\d])`);
    if (!re.test(sourceCorpus)) problems.push(`number "${n}"`);
  }

  if (/\byears?\b/i.test(suggestion) && /\d+\s*\+?\s*years?/i.test(suggestion) && !/\d+\s*\+?\s*years?/i.test(sourceCorpus)) {
    problems.push("years of experience");
  }

  for (const word of SENIORITY_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(suggestion) && !re.test(sourceCorpus)) problems.push(`seniority "${word}"`);
  }

  for (const re of CLAIM_PHRASES) {
    if (re.test(suggestion) && !re.test(sourceCorpus)) problems.push(`claim "${suggestion.match(re)?.[0]}"`);
  }

  for (const term of findKnownTerms(suggestion)) {
    if (![term, ...aliasesFor(term)].some((v) => containsTerm(sourceCorpus, v))) problems.push(`skill "${term}"`);
  }

  return problems;
}
