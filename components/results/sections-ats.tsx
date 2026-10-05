"use client";

import { Bot, Check, CircleAlert, LayoutList, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SECTION_LABEL } from "@/components/results/findings";
import { ResultsSection } from "@/components/results/shared";
import type { ResumeAnalysis } from "@/lib/schemas";
import { cn, scoreTone, TONE_TEXT } from "@/lib/utils";

export function SectionQuality({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <ResultsSection id="sections">
      <Card className="p-5 sm:p-6">
        <SectionHeading id="sections-title" icon={<LayoutList />} title="Resume Section Analysis" description="Sections this job doesn't need won't count against you." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {analysis.sectionAnalysis.map((s) => (
            <div key={s.section} className="flex flex-col rounded-2xl border border-border bg-surface-2/40 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{SECTION_LABEL[s.section]}</p>
                {s.score !== null ? (
                  <span className={cn("text-lg font-semibold tabular-nums", TONE_TEXT[scoreTone(s.score)])}>{s.score}</span>
                ) : (
                  <Badge>{s.present ? "Not scored" : "Not required"}</Badge>
                )}
              </div>
              {s.score !== null ? <ProgressBar value={s.score} className="mt-2" label={`${SECTION_LABEL[s.section]} score`} /> : null}
              <div className="mt-3 space-y-2 text-sm">
                {s.strengths.map((t) => (
                  <p key={t} className="flex gap-2 text-muted"><Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />{t}</p>
                ))}
                {s.issues.map((t) => (
                  <p key={t} className="flex gap-2 text-muted"><CircleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />{t}</p>
                ))}
                {s.recommendations.map((t) => (
                  <p key={t} className="rounded-lg bg-surface px-2.5 py-1.5 text-xs text-foreground/85">{t}</p>
                ))}
                {!s.strengths.length && !s.issues.length && !s.recommendations.length ? (
                  <p className="text-xs text-subtle">{s.present ? "Looks good." : "Not present, and not needed for this job."}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </ResultsSection>
  );
}

const SEVERITY_TONE = { high: "danger", medium: "warning", low: "neutral" } as const;

export function AtsSection({ analysis }: { analysis: ResumeAnalysis }) {
  const { ats } = analysis;
  return (
    <ResultsSection id="ats">
      <Card className="p-5 sm:p-6">
        <SectionHeading id="ats-title" icon={<Bot />} title="ATS Compatibility Assessment" description="How easily applicant tracking systems should be able to read your resume." />
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
            <p className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Compatibility</span>
              <span className={cn("text-3xl font-semibold tabular-nums", TONE_TEXT[scoreTone(ats.score)])}>{ats.score}</span>
            </p>
            <ProgressBar value={ats.score} className="mt-3" label="ATS compatibility" />
            <ul className="mt-4 space-y-2">
              {ats.checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  {c.passed ? <Check className="size-4 text-success" aria-hidden /> : <X className="size-4 text-danger" aria-hidden />}
                  <span className={c.passed ? "text-muted" : "text-foreground"}>{c.label}</span>
                  <span className="sr-only">{c.passed ? "passed" : "needs attention"}</span>
                </li>
              ))}
            </ul>
          </div>
          {ats.issues.length ? (
            <ul className="space-y-3">
              {ats.issues.map((i) => (
                <li key={i.id} className="rounded-2xl border border-border p-4">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {i.title} <Badge tone={SEVERITY_TONE[i.severity]} className="capitalize">{i.severity}</Badge>
                  </p>
                  <p className="mt-1 text-sm text-muted">{i.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<ShieldCheck />} title="No major ATS compatibility issues detected." description="Your resume uses a structure that parsers generally handle well." />
          )}
        </div>
      </Card>
    </ResultsSection>
  );
}
