"use client";

import { Layers } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ResultsSection } from "@/components/results/shared";
import type { ResumeAnalysis, SkillMatch } from "@/lib/schemas";

function SkillRow({ skill, tone }: { skill: SkillMatch; tone: "success" | "warning" | "danger" }) {
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">
          {skill.skill}
          {skill.importance === "required" ? <span className="ml-1.5 text-xs font-normal text-subtle">required</span> : null}
        </span>
        <span className="tabular-nums text-xs text-muted">{skill.coverage}%</span>
      </div>
      <ProgressBar value={skill.coverage} tone={tone} label={`${skill.skill} coverage`} />
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{skill.explanation}</p>
    </li>
  );
}

export function SkillsGap({ analysis }: { analysis: ResumeAnalysis }) {
  const { strong, partial, missing } = analysis.skillsAnalysis;
  const total = strong.length + partial.length + missing.length;
  const columns = [
    { title: "Strong Skills", items: strong, tone: "success" as const, empty: "No strongly demonstrated job skills yet." },
    { title: "Partial Skills", items: partial, tone: "warning" as const, empty: "No partially demonstrated skills." },
    { title: "Missing Skills", items: missing, tone: "danger" as const, empty: "No missing skills. Every skill in the job post shows up in your resume." },
  ];

  return (
    <ResultsSection id="skills">
      <Card className="p-5 sm:p-6">
        <SectionHeading id="skills-title" icon={<Layers />} title="Skills Gap Analysis" description="How the skills in the job post line up with what your resume shows." />
        {total ? (
          <>
            <div className="mb-6 flex h-3 overflow-hidden rounded-full bg-surface-3" role="img" aria-label={`${strong.length} strong, ${partial.length} partial, ${missing.length} missing skills`}>
              <div className="bg-success" style={{ width: `${(strong.length / total) * 100}%` }} />
              <div className="bg-warning" style={{ width: `${(partial.length / total) * 100}%` }} />
              <div className="bg-danger/80" style={{ width: `${(missing.length / total) * 100}%` }} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {columns.map((c) => (
                <div key={c.title} className="rounded-2xl border border-border bg-surface-2/40 p-4">
                  <p className="mb-4 flex items-center justify-between text-sm font-medium">
                    {c.title} <span className="text-xs tabular-nums text-subtle">{c.items.length}</span>
                  </p>
                  {c.items.length ? (
                    <ul className="divide-y divide-border/60">
                      {c.items.map((s) => (
                        <SkillRow key={s.skill} skill={s} tone={c.tone} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted">{c.empty}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState icon={<Layers />} title="No specific skills listed in this job" description="The posting doesn't name concrete skills, so the analysis focuses on responsibilities." />
        )}
      </Card>
    </ResultsSection>
  );
}
