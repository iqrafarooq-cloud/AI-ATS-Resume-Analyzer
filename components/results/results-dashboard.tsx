"use client";

import { Download, Info, RotateCcw, Wand2 } from "lucide-react";
import Link from "next/link";
import { AtsSection, SectionQuality } from "@/components/results/sections-ats";
import { ExperienceSection } from "@/components/results/experience";
import { PriorityActions, StrengthsAndIssues } from "@/components/results/findings";
import { JobInsights } from "@/components/results/job-insights";
import { JobMatch } from "@/components/results/job-match";
import { KeywordAnalysis } from "@/components/results/keywords";
import { ReadinessCheck } from "@/components/results/readiness";
import { ScoreOverview } from "@/components/results/score-overview";
import { NoAnalysis, ResultsSkeleton } from "@/components/results/shared";
import { SkillsGap } from "@/components/results/skills-gap";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/lib/session";

const NAV = [
  { id: "actions", label: "Fix first" },
  { id: "job-match", label: "Job match" },
  { id: "keywords", label: "Keywords" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "sections", label: "Sections" },
  { id: "ats", label: "ATS" },
  { id: "job", label: "The job" },
  { id: "readiness", label: "Readiness" },
];

export function ResultsDashboard() {
  const analysis = useAnalysis();
  if (analysis === undefined) return <ResultsSkeleton />;
  if (analysis === null) return <NoAnalysis />;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-strong">Analysis results</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/analyze"><RotateCcw aria-hidden /> New analysis</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/report"><Download aria-hidden /> Export report</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/improve"><Wand2 aria-hidden /> Improve resume</Link>
          </Button>
        </div>
      </div>

      {analysis.notices.length ? (
        <div role="status" className="mb-5 flex gap-3 rounded-2xl border border-warning/25 bg-warning/[0.05] p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <ul className="space-y-1 text-muted">{analysis.notices.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      ) : null}

      <ScoreOverview analysis={analysis} />

      <nav aria-label="Result sections" className="sticky top-16 z-20 -mx-4 mt-6 overflow-x-auto border-y border-border bg-background/85 px-4 py-2.5 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border">
        <ul className="flex gap-1">
          {NAV.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} className="block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 space-y-6">
        <StrengthsAndIssues analysis={analysis} />
        <PriorityActions analysis={analysis} />
        <JobMatch analysis={analysis} />
        <KeywordAnalysis analysis={analysis} />
        <SkillsGap analysis={analysis} />
        <ExperienceSection analysis={analysis} />
        <SectionQuality analysis={analysis} />
        <AtsSection analysis={analysis} />
        <JobInsights analysis={analysis} />
        <ReadinessCheck score={analysis.scores.overall} readiness={analysis.readiness} />
      </div>
    </div>
  );
}
