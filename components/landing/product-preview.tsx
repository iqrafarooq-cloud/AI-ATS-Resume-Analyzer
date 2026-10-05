"use client";

import { motion } from "framer-motion";
import { Bot, Check, Layers, Search, Sparkles, TrendingUp, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScoreRing } from "@/components/ui/score-ring";

const METRICS = [
  { label: "ATS Compatibility", value: 91, icon: Bot },
  { label: "Keyword Match", value: 78, icon: Search },
  { label: "Skills Match", value: 84, icon: Layers },
  { label: "Experience Match", value: 80, icon: TrendingUp },
];

export function ProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-5xl [perspective:1200px]"
    >
      <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_65%)] blur-2xl" />
      <div className="glow overflow-hidden rounded-3xl border border-border-strong bg-surface/90 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="ml-3 truncate text-xs text-subtle">resumepilot / results / senior-qa-automation-engineer</span>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[260px_1fr] md:p-7">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-2 p-6 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-subtle">ATS Match Score</p>
            <ScoreRing score={82} size={150} />
            <Badge tone="success" className="mt-4">
              <Check aria-hidden /> Strong Match
            </Badge>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="rounded-xl border border-border bg-surface-2 p-3.5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <m.icon className="size-3.5 text-primary-strong" aria-hidden />
                      <span className="truncate">{m.label}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{m.value}</span>
                  </div>
                  <ProgressBar value={m.value} label={m.label} />
                </motion.div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface-2 p-3.5">
                <p className="mb-2.5 text-xs font-medium text-muted">Matched keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {["API Testing", "Postman", "Selenium", "Agile", "Jira"].map((k) => (
                    <Badge key={k} tone="success">{k}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-3.5">
                <p className="mb-2.5 text-xs font-medium text-muted">Fix these first</p>
                <ul className="space-y-1.5 text-xs text-muted">
                  <li className="flex items-center gap-2"><TriangleAlert className="size-3.5 text-warning" aria-hidden /> Show CI/CD evidence if you have it</li>
                  <li className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary-strong" aria-hidden /> Tailor summary to QA automation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
