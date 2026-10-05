"use client";

import { CircleCheck, CircleDashed, CircleX, Info, KeyRound } from "lucide-react";
import { useState } from "react";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ResultsSection } from "@/components/results/shared";
import type { KeywordMatch, ResumeAnalysis } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Group = "matched" | "underused" | "missing";

const GROUP_STYLE: Record<Group, { pill: string; active: string; icon: typeof CircleCheck; color: string }> = {
  matched: { pill: "border-success/30 bg-success/10 text-success hover:bg-success/15", active: "ring-2 ring-success/50", icon: CircleCheck, color: "text-success" },
  underused: { pill: "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15", active: "ring-2 ring-warning/50", icon: CircleDashed, color: "text-warning" },
  missing: { pill: "border-danger/30 bg-danger/10 text-danger hover:bg-danger/15", active: "ring-2 ring-danger/50", icon: CircleX, color: "text-danger" },
};

function explain(k: KeywordMatch, group: Group): string {
  if (group === "matched") return `Found ${k.count} time${k.count === 1 ? "" : "s"}, including in your experience. ${k.whyItMatters}`;
  if (group === "underused")
    return `Appears ${k.count} time${k.count === 1 ? "" : "s"}${k.inExperience ? "" : ", but not in any experience bullet"}. ${k.whyItMatters} Show it in context where you genuinely used it.`;
  return `${k.whyItMatters} This should only be added if you actually have this experience.`;
}

export function KeywordAnalysis({ analysis }: { analysis: ResumeAnalysis }) {
  const [selected, setSelected] = useState<{ group: Group; term: string } | null>(null);
  const groups: { group: Group; title: string; items: KeywordMatch[]; empty: string }[] = [
    { group: "matched", title: "Matched Keywords", items: analysis.matchedKeywords, empty: "No strong keyword matches yet." },
    { group: "underused", title: "Underused Keywords", items: analysis.underusedKeywords, empty: "Nothing underused here. Nice work." },
    { group: "missing", title: "Missing Keywords", items: analysis.missingKeywords, empty: "No missing keywords detected." },
  ];
  const selectedItem = selected ? groups.find((g) => g.group === selected.group)?.items.find((k) => k.term === selected.term) : null;
  const importantMissing = analysis.missingKeywords.filter((k) => k.importance !== "nice").slice(0, 5);

  return (
    <ResultsSection id="keywords">
      <Card className="p-5 sm:p-6">
        <SectionHeading id="keywords-title" icon={<KeyRound />} title="Keyword Analysis" description="Click a keyword to see why it matters. Work them in where they fit naturally rather than stuffing them in." />
        <div className="grid gap-4 md:grid-cols-3">
          {groups.map((g) => {
            const style = GROUP_STYLE[g.group];
            return (
              <div key={g.group} className="rounded-2xl border border-border bg-surface-2/40 p-4">
                <p className="mb-3 flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <style.icon className={cn("size-4", style.color)} aria-hidden /> {g.title}
                  </span>
                  <span className="text-xs tabular-nums text-subtle">{g.items.length}</span>
                </p>
                {g.items.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((k) => {
                      const active = selected?.group === g.group && selected.term === k.term;
                      return (
                        <button
                          key={k.term}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelected(active ? null : { group: g.group, term: k.term })}
                          className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-all", style.pill, active && style.active)}
                        >
                          {k.term}
                          {k.importance === "required" ? <span className="sr-only"> (required)</span> : null}
                          {k.importance === "required" ? <span aria-hidden className="ml-1 opacity-60">*</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted">{g.empty}</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-subtle">* Required by the job description</p>

        <div aria-live="polite">
          {selectedItem && selected ? (
            <div className="mt-4 flex gap-3 rounded-2xl border border-border-strong bg-surface-2 p-4">
              <Info className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden />
              <div className="text-sm">
                <p className="font-medium">
                  {selectedItem.term} <span className="text-xs font-normal capitalize text-subtle">- {selectedItem.importance}, {selectedItem.category.replace("_", " ")}</span>
                </p>
                <p className="mt-1 text-muted">{explain(selectedItem, selected.group)}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium">Why the important missing keywords matter</h3>
          {importantMissing.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {importantMissing.map((k) => (
                <li key={k.term} className="rounded-2xl border border-border p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <CircleX className="size-4 text-danger" aria-hidden /> {k.term}
                    <span className="text-xs font-normal capitalize text-subtle">{k.importance}</span>
                  </p>
                  <p className="mt-1.5 text-sm text-muted">{k.whyItMatters}</p>
                  <p className="mt-2 text-xs text-warning/90">This should only be added if you actually have this experience.</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<CircleCheck />} title="No missing keywords" description="Every important keyword from this job appears in your resume." />
          )}
        </div>
      </Card>
    </ResultsSection>
  );
}
