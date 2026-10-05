"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

export const ANALYSIS_STEPS = [
  "Reading resume",
  "Extracting skills",
  "Understanding job requirements",
  "Comparing experience",
  "Checking ATS compatibility",
  "Identifying keyword gaps",
  "Generating recommendations",
];

/**
 * Steps advance on a paced timer that mirrors the server pipeline; the final step
 * stays active until the response actually arrives, then everything completes.
 */
export function AnalysisProgress({ done }: { done: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 4200);
    return () => window.clearInterval(id);
  }, [done]);

  const current = done ? ANALYSIS_STEPS.length : step;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-title"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glow w-full max-w-md rounded-3xl border border-border-strong bg-surface p-7 sm:p-8"
      >
        <div className="mb-7 flex items-center gap-4">
          <motion.div animate={{ rotate: done ? 0 : [0, 6, -6, 0] }} transition={{ repeat: done ? 0 : Infinity, duration: 2.4 }}>
            <LogoMark className="size-11" />
          </motion.div>
          <div>
            <h2 id="progress-title" className="text-lg font-semibold tracking-tight">Analyzing your application</h2>
            <p className="text-sm text-muted">This usually takes about a minute.</p>
          </div>
        </div>

        <ol className="space-y-1" aria-live="polite">
          {ANALYSIS_STEPS.map((label, i) => {
            const state = i < current ? "done" : i === current ? "active" : "pending";
            return (
              <li key={label} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors", state === "active" && "bg-primary/[0.08]")}>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                    state === "done" && "border-success/40 bg-success/15 text-success",
                    state === "active" && "border-primary/50 text-primary-strong",
                    state === "pending" && "border-border-strong text-subtle",
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {state === "done" ? (
                      <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="size-3.5" aria-hidden />
                      </motion.span>
                    ) : state === "active" ? (
                      <Loader2 key="l" className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <span key="n">{i + 1}</span>
                    )}
                  </AnimatePresence>
                </span>
                <span className={cn("text-sm", state === "pending" ? "text-subtle" : "text-foreground", state === "active" && "font-medium")}>
                  {label}
                  <span className="sr-only">{state === "done" ? " (complete)" : state === "active" ? " (in progress)" : ""}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 h-1 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${((current + (done ? 0 : 0.5)) / ANALYSIS_STEPS.length) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
