"use client";

import { motion } from "framer-motion";
import { Bot, Briefcase, Info, Layers, Search, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScoreRing } from "@/components/ui/score-ring";
import type { ResumeAnalysis } from "@/lib/schemas";
import { cn, scoreTone, shortLabel, TONE_TEXT } from "@/lib/utils";

const TONE_BADGE = { success: "success", primary: "primary", warning: "warning", danger: "danger" } as const;

export function ScoreOverview({ analysis }: { analysis: ResumeAnalysis }) {
  const { scores } = analysis;
  const metrics = [
    { key: "ats", label: "ATS Compatibility", value: scores.ats, weight: scores.weights.ats, icon: Bot },
    { key: "jobMatch", label: "Job Match", value: scores.jobMatch, weight: scores.weights.jobMatch, icon: Briefcase },
    { key: "keyword", label: "Keyword Match", value: scores.keyword, weight: scores.weights.keyword, icon: Search },
    { key: "skills", label: "Skills Match", value: scores.skills, weight: scores.weights.skills, icon: Layers },
    { key: "experience", label: "Experience Match", value: scores.experience, weight: scores.weights.experience, icon: TrendingUp },
  ];
  const tone = scoreTone(scores.overall);

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_20%,transparent),transparent)]" />
        <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center">
            <ScoreRing score={scores.overall} size={184} stroke={13} />
            <Badge tone={TONE_BADGE[tone]} className="mt-4 px-3 py-1 text-sm">
              {scores.label}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Overall resume health</p>
            <h1 id="overview-title" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Your Resume Match</h1>
            <p className="mt-1 text-sm text-muted">
              For <span className="text-foreground">{analysis.jobInsights.title}</span> <span aria-hidden>&middot;</span> {analysis.fileName}
            </p>
            <div className="mt-5 rounded-2xl border border-border bg-surface-2/60 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Info className="size-4 text-primary-strong" aria-hidden /> Why this score?
              </p>
              <p className="text-sm leading-relaxed text-muted">{analysis.summary}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
              <span>Resume quality <span className={cn("font-medium", TONE_TEXT[scoreTone(scores.resumeQuality)])}>{scores.resumeQuality}</span></span>
              <span>Weighted: job 30%, keywords 20%, skills 15%, experience 15%, ATS 10%, quality 10%</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {metrics.map((m, i) => {
          const t = scoreTone(m.value);
          return (
            <motion.div key={m.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className={cn(i === 4 && "col-span-2 lg:col-span-1")}>
              <Card className="h-full p-4 transition-colors hover:border-border-strong">
                <div className="flex items-center justify-between">
                  <m.icon className="size-4 text-muted" aria-hidden />
                  <span className="text-[11px] text-subtle">{Math.round(m.weight * 100)}% weight</span>
                </div>
                <p className="mt-3 text-xs text-muted">{m.label}</p>
                <p className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums">{m.value}</span>
                  <span className={cn("text-xs font-medium", TONE_TEXT[t])}>{shortLabel(m.value)}</span>
                </p>
                <ProgressBar value={m.value} className="mt-3" label={m.label} />
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
