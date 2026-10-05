"use client";

import { ArrowRight, CircleCheck, CircleDashed, Rocket } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { ResultsSection } from "@/components/results/shared";
import type { Readiness } from "@/lib/schemas";

const STATUS_TONE = { Ready: "success", "Nearly Ready": "warning", "Needs Improvement": "danger" } as const;

export function ReadinessCheck({ score, readiness, showCta = true }: { score: number; readiness: Readiness; showCta?: boolean }) {
  return (
    <ResultsSection id="readiness">
      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent)_16%,transparent),transparent)]" />
        <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
          <ScoreRing score={score} size={120} stroke={9} />
          <div>
            <h2 id="readiness-title" className="flex flex-wrap items-center gap-3 text-xl font-semibold tracking-tight">
              <Rocket className="size-5 text-primary-strong" aria-hidden /> Application Readiness
              <Badge tone={STATUS_TONE[readiness.status]} className="text-sm">{readiness.status}</Badge>
            </h2>
            <p className="mb-3 mt-3 text-sm text-muted">Before applying:</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {readiness.checklist.map((c) => (
                <li key={c.label} className="flex gap-2.5 text-sm">
                  {c.done ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />}
                  <span>
                    <span className={c.done ? "text-muted line-through decoration-subtle" : "font-medium"}>{c.label}</span>
                    <span className="sr-only">{c.done ? " (done)" : " (to do)"}</span>
                    <span className="block text-xs text-subtle">{c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {showCta ? (
            <Button asChild size="lg" className="no-print">
              <Link href="/improve">
                Review Improvements <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </Card>
    </ResultsSection>
  );
}
