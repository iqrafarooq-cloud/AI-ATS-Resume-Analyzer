"use client";

import { Briefcase, Sparkles } from "lucide-react";
import { useDeferredValue, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { extractJobHeuristic } from "@/lib/parsing/job-heuristics";
import { wordCount } from "@/lib/text";

export const MIN_JOB_WORDS = 20;
export const MAX_JOB_CHARS = 20000;

export function JobInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const deferred = useDeferredValue(value);
  const words = wordCount(value);
  const preview = useMemo(() => (wordCount(deferred) >= MIN_JOB_WORDS ? extractJobHeuristic(deferred) : null), [deferred]);
  const skills = preview ? [...preview.requiredSkills, ...preview.preferredSkills].slice(0, 12) : [];

  return (
    <div className="flex h-full flex-col">
      <label htmlFor="job-description" className="sr-only">
        Job description
      </label>
      <textarea
        id="job-description"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_JOB_CHARS))}
        placeholder={"Paste the full job description here, including the title, responsibilities, requirements and nice-to-haves.\n\nThe more you include, the better the analysis."}
        className="min-h-64 w-full flex-1 resize-y rounded-2xl border border-border-strong bg-surface-2/50 p-4 text-sm leading-relaxed text-foreground placeholder:text-subtle focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"
        aria-describedby="job-meta"
      />
      <div id="job-meta" className="mt-2 flex items-center justify-between text-xs text-subtle" aria-live="polite">
        <span>
          {value.length.toLocaleString()} characters <span aria-hidden>&middot;</span> ~{words.toLocaleString()} words
        </span>
        {words > 0 && words < MIN_JOB_WORDS ? <span className="text-warning">Add at least {MIN_JOB_WORDS} words</span> : null}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface-2/40 p-4">
        {preview ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="size-4 text-primary-strong" aria-hidden />
              <span className="text-muted">Detected role:</span>
              <span className="truncate font-medium">{preview.title}</span>
            </div>
            <div>
              <p className="mb-2 text-xs text-subtle">Detected skills</p>
              {skills.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s} tone={preview.requiredSkills.includes(s) ? "primary" : "neutral"}>{s}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">No common skills spotted yet. The full analysis will look more closely.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-xs text-subtle">
            <Sparkles className="size-3.5" aria-hidden /> Detected job title and skills will appear here as you paste.
          </p>
        )}
      </div>
    </div>
  );
}
