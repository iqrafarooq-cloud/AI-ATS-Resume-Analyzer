"use client";

import { ArrowUpNarrowWide, Ban, Eye, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ResumeAnalysis } from "@/lib/schemas";

export function SkillsAdvicePanel({ analysis }: { analysis: ResumeAnalysis }) {
  const advice = analysis.resumeImprovements.skills;
  const groups = [
    { icon: Star, title: "Emphasize", body: "Your skills that matter most for this job.", items: advice.emphasize, tone: "success" as const },
    { icon: ArrowUpNarrowWide, title: "Move to the front", body: "Reorder your skills list in this order.", items: advice.reorder, tone: "primary" as const, ordered: true },
    { icon: Eye, title: "Relevant but buried", body: "Used in your experience but missing from your skills list.", items: advice.buried, tone: "warning" as const },
    { icon: Ban, title: "Only add if you genuinely have them", body: "Job skills not found anywhere in your resume.", items: advice.doNotAddUnlessTrue, tone: "danger" as const },
  ];

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Current skills</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {analysis.resumeFacts.skills.length ? analysis.resumeFacts.skills.slice(0, 40).map((s) => <Badge key={s}>{s}</Badge>) : <p className="text-sm text-muted">No skills section detected.</p>}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title} className="rounded-2xl border border-border bg-surface-2/40 p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><g.icon className="size-4 text-primary-strong" aria-hidden /> {g.title}</p>
            <p className="mt-0.5 text-xs text-subtle">{g.body}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {g.items.length ? (
                g.items.map((s, i) => (
                  <Badge key={s} tone={g.tone}>
                    {g.ordered ? <span className="tabular-nums opacity-70">{i + 1}.</span> : null}
                    {s}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted">Nothing here.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {advice.notes ? <p className="mt-4 text-sm text-muted">{advice.notes}</p> : null}
    </Card>
  );
}
