"use client";

import { CircleAlert, CircleCheck, ListOrdered, ThumbsUp, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ImpactBadge, ResultsSection } from "@/components/results/shared";
import type { ResumeAnalysis, SectionKey } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export const SECTION_LABEL: Record<SectionKey, string> = {
  summary: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  projects: "Projects",
  certifications: "Certifications",
  formatting: "Formatting",
};

export function StrengthsAndIssues({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ResultsSection id="strengths">
        <Card className="h-full p-5 sm:p-6">
          <SectionHeading id="strengths-title" icon={<ThumbsUp />} title="What You're Doing Well" />
          {analysis.strengths.length ? (
            <ul className="space-y-3">
              {analysis.strengths.map((s) => (
                <li key={s.title} className="flex gap-3">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<ThumbsUp />} title="No standout strengths found yet" description="Strengthening keyword alignment and bullet quality will surface clear strengths." />
          )}
        </Card>
      </ResultsSection>

      <ResultsSection id="issues">
        <Card className="h-full p-5 sm:p-6">
          <SectionHeading id="issues-title" icon={<TriangleAlert />} title="Potential Issues" />
          {analysis.weaknesses.length ? (
            <ul className="space-y-3">
              {analysis.weaknesses.map((w) => (
                <li key={w.title} className="flex gap-3">
                  <CircleAlert className={cn("mt-0.5 size-4 shrink-0", w.impact === "high" ? "text-danger" : w.impact === "medium" ? "text-warning" : "text-muted")} aria-hidden />
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {w.title} <ImpactBadge impact={w.impact} />
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{w.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<CircleCheck />} title="No major issues detected" />
          )}
        </Card>
      </ResultsSection>
    </div>
  );
}

export function PriorityActions({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <ResultsSection id="actions">
      <Card className="relative overflow-hidden border-primary/25 p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <SectionHeading id="actions-title" icon={<ListOrdered />} title="Fix These First" description="Start at the top. These changes will make the biggest difference." />
        {analysis.priorityActions.length ? (
          <ol className="space-y-3">
            {analysis.priorityActions.map((a, i) => (
              <li key={a.id} className="flex gap-4 rounded-2xl border border-border bg-surface-2/50 p-4">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold", i < 2 ? "bg-primary text-primary-foreground" : "bg-surface-3 text-foreground")}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{a.title}</p>
                    <ImpactBadge impact={a.impact} />
                    <Badge>{SECTION_LABEL[a.section]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90">
                    <span className="text-subtle">What to change: </span>
                    {a.whatToChange}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    <span className="text-subtle">Why it matters: </span>
                    {a.whyItMatters}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon={<CircleCheck />} title="No priority actions" description="Your resume is in great shape for this job." />
        )}
      </Card>
    </ResultsSection>
  );
}
