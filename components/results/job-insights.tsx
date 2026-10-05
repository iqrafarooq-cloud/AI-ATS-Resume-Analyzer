"use client";

import { Compass, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeading } from "@/components/ui/card";
import { ResultsSection } from "@/components/results/shared";
import type { ResumeAnalysis } from "@/lib/schemas";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">{title}</p>
      {children}
    </div>
  );
}

function Pills({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "primary" }) {
  if (!items.length) return <p className="text-sm text-subtle">None stated</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <Badge key={s} tone={tone}>{s}</Badge>
      ))}
    </div>
  );
}

export function JobInsights({ analysis }: { analysis: ResumeAnalysis }) {
  const job = analysis.jobInsights;
  const seniority = job.seniority === "unknown" ? "Not specified" : job.seniority.charAt(0).toUpperCase() + job.seniority.slice(1);
  const topRequirements = [...job.experienceRequirements, ...job.educationRequirements].slice(0, 5);

  return (
    <ResultsSection id="job">
      <Card className="p-5 sm:p-6">
        <SectionHeading id="job-title" icon={<Compass />} title="Understanding This Job" description="A quick read on what this employer is looking for." />
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
            <p className="text-xs text-subtle">Job Title</p>
            <p className="mt-1 font-medium">{job.title}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
            <p className="text-xs text-subtle">Seniority</p>
            <p className="mt-1 font-medium">{seniority}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
            <p className="text-xs text-subtle">Experience</p>
            <p className="mt-1 font-medium">{job.yearsOfExperience ? `${job.yearsOfExperience}+ years` : "Not specified"}</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <Block title="Top Technical Skills"><Pills items={job.requiredSkills.slice(0, 14)} tone="primary" /></Block>
            <Block title="Preferred Skills"><Pills items={job.preferredSkills.slice(0, 12)} /></Block>
            {topRequirements.length ? (
              <Block title="Top Requirements">
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted">{topRequirements.map((r) => <li key={r}>{r}</li>)}</ul>
              </Block>
            ) : null}
          </div>
          <div className="space-y-5">
            <Block title="Important Responsibilities">
              {job.responsibilities.length ? (
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted">{job.responsibilities.slice(0, 6).map((r) => <li key={r}>{r}</li>)}</ul>
              ) : (
                <p className="text-sm text-subtle">No responsibilities section detected</p>
              )}
            </Block>
            <div className="rounded-2xl border border-primary/25 bg-primary/[0.05] p-4">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="size-4 text-primary-strong" aria-hidden /> Recruiter Priorities
              </p>
              <p className="mb-3 text-xs text-subtle">Our best guess based on how the post is written. This isn&apos;t information from the employer.</p>
              {job.recruiterPriorities.length ? (
                <ul className="space-y-2.5">
                  {job.recruiterPriorities.slice(0, 5).map((p) => (
                    <li key={p.priority} className="text-sm">
                      <p className="font-medium">{p.priority}</p>
                      <p className="text-xs text-muted">{p.rationale}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-subtle">Not enough detail to infer priorities.</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </ResultsSection>
  );
}
