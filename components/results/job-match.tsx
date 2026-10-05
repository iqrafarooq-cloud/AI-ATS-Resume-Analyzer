"use client";

import { GitCompareArrows } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LEVEL_TEXT, LevelBadge, ResultsSection } from "@/components/results/shared";
import type { ResumeAnalysis } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function JobMatch({ analysis }: { analysis: ResumeAnalysis }) {
  const reqs = analysis.jobRequirements;
  const counts = {
    strong: reqs.filter((r) => r.level === "strong").length,
    partial: reqs.filter((r) => r.level === "partial").length,
    gap: reqs.filter((r) => r.level === "gap").length,
  };

  return (
    <ResultsSection id="job-match">
      <Card className="p-5 sm:p-6">
        <SectionHeading id="job-match-title" icon={<GitCompareArrows />} title="How well does your resume match this job?" description="Each requirement from the job post, checked against your resume." />

        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Strong Matches", value: counts.strong, cls: "text-success border-success/25 bg-success/[0.05]" },
            { label: "Partial Matches", value: counts.partial, cls: "text-warning border-warning/25 bg-warning/[0.05]" },
            { label: "Missing Areas", value: counts.gap, cls: "text-danger border-danger/25 bg-danger/[0.05]" },
          ].map((c) => (
            <div key={c.label} className={cn("rounded-2xl border p-3 sm:p-4", c.cls)}>
              <p className="text-2xl font-semibold tabular-nums">{c.value}</p>
              <p className="mt-0.5 text-xs text-muted sm:text-sm">{c.label}</p>
            </div>
          ))}
        </div>

        {reqs.length ? (
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-subtle">
                  <th scope="col" className="py-2.5 pr-4 font-medium">Requirement</th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">Resume Match</th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">Status</th>
                  <th scope="col" className="py-2.5 font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {reqs.map((r, i) => (
                  <tr key={`${r.requirement}-${i}`} className="border-b border-border/60 align-top last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{r.requirement}</p>
                      <p className="mt-0.5 text-xs capitalize text-subtle">{r.importance}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted">{LEVEL_TEXT[r.level]}</td>
                    <td className="py-3 pr-4"><LevelBadge level={r.level} /></td>
                    <td className="py-3 text-muted">
                      {r.evidence ? <q className="text-foreground/80">{r.evidence.replace(/^["'“”]+|["'“”]+$/g, "")}</q> : <span className="text-subtle">No evidence found</span>}
                      <p className="mt-1 text-xs text-subtle">{r.note}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<GitCompareArrows />} title="No requirements extracted" description="The job description didn't contain clearly stated requirements." />
        )}
      </Card>
    </ResultsSection>
  );
}
