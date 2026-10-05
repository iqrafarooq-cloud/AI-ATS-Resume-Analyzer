"use client";

import { ArrowRight, FileQuestion } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import type { CriterionRating, Impact, MatchLevel } from "@/lib/schemas";

export function LevelBadge({ level }: { level: MatchLevel }) {
  if (level === "strong") return <Badge tone="success">Match</Badge>;
  if (level === "partial") return <Badge tone="warning">Partial</Badge>;
  return <Badge tone="danger">Gap</Badge>;
}

export const LEVEL_TEXT: Record<MatchLevel, string> = { strong: "Strong", partial: "Partial", gap: "Limited" };

export function ImpactBadge({ impact }: { impact: Impact }) {
  const tone = impact === "high" ? "danger" : impact === "medium" ? "warning" : "neutral";
  return <Badge tone={tone}>{impact === "high" ? "High" : impact === "medium" ? "Medium" : "Low"} Impact</Badge>;
}

const RATING_LABEL: Record<CriterionRating, string> = { strong: "Strong", good: "Good", weak: "Weak", missing: "Missing" };
const RATING_TONE = { strong: "success", good: "primary", weak: "warning", missing: "danger" } as const;

export function RatingBadge({ rating }: { rating: CriterionRating }) {
  return <Badge tone={RATING_TONE[rating]}>{RATING_LABEL[rating]}</Badge>;
}

export function ResultsSection({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-36 ${className ?? ""}`}>
      {children}
    </section>
  );
}

export function NoAnalysis() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-24 sm:px-6">
      <EmptyState
        icon={<FileQuestion />}
        title="No analysis yet"
        description="Results are kept only for this browser session. Upload your resume and a job description to generate a new analysis."
        action={
          <Button asChild>
            <Link href="/analyze">
              Start an analysis <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading results">
      <Card className="p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <Skeleton className="size-44 rounded-full" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
