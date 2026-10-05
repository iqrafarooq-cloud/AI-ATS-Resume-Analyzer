"use client";

import { ArrowRight, Briefcase, CircleCheck, CircleMinus, Lightbulb, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Expandable } from "@/components/ui/expandable";
import { ScoreRing } from "@/components/ui/score-ring";
import { RatingBadge, ResultsSection } from "@/components/results/shared";
import type { BulletAnalysis, ExperienceAnalysis as Role, ResumeAnalysis } from "@/lib/schemas";
import { cn, scoreTone, TONE_TEXT } from "@/lib/utils";

const CRITERIA: { key: keyof BulletAnalysis["criteria"]; label: string }[] = [
  { key: "actionVerb", label: "Action Verb" },
  { key: "technicalDetail", label: "Technical Detail" },
  { key: "clarity", label: "Clarity" },
  { key: "impact", label: "Impact" },
  { key: "metric", label: "Metric" },
  { key: "relevance", label: "Relevance" },
];

function List({ title, items, icon, tone }: { title: string; items: string[]; icon: React.ReactNode; tone: string }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">{title}</p>
      <ul className="space-y-1.5">
        {items.map((s) => (
          <li key={s} className="flex gap-2 text-sm text-muted">
            <span className={cn("mt-0.5 shrink-0 [&_svg]:size-3.5", tone)}>{icon}</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulletCard({ bullet }: { bullet: BulletAnalysis }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm">{bullet.text}</p>
        <span className={cn("shrink-0 text-sm font-semibold tabular-nums", TONE_TEXT[scoreTone(bullet.score)])} aria-label={`Bullet score ${bullet.score}`}>
          {bullet.score}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CRITERIA.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-2.5 py-1.5">
            <dt className="text-xs text-muted">{c.label}</dt>
            <dd><RatingBadge rating={bullet.criteria[c.key]} /></dd>
          </div>
        ))}
      </dl>
      {bullet.suggestion ? (
        <div className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.05] p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary-strong">
            <ArrowRight className="size-3.5" aria-hidden /> Suggested improvement
          </p>
          <p className="text-sm">{bullet.suggestion}</p>
          {bullet.rationale ? <p className="mt-1.5 text-xs text-muted">{bullet.rationale}</p> : null}
        </div>
      ) : bullet.rationale ? (
        <p className="mt-3 text-xs text-muted">{bullet.rationale}</p>
      ) : null}
    </div>
  );
}

function RoleCard({ role, defaultOpen }: { role: Role; defaultOpen: boolean }) {
  return (
    <Card className="p-4 sm:p-5">
      <Expandable
        defaultOpen={defaultOpen}
        trigger={
          <div className="flex items-center gap-4">
            <ScoreRing score={role.matchPercent} size={58} stroke={5} showTotal={false} />
            <div className="min-w-0">
              <p className="truncate font-medium">{role.title}</p>
              <p className="truncate text-sm text-muted">
                {[role.company, role.dates].filter(Boolean).join(" · ") || "Role details"}
              </p>
              <p className="mt-1 text-xs text-subtle">
                {role.matchPercent}% job match <span aria-hidden>&middot;</span> bullet quality {role.bulletQuality}/100
              </p>
            </div>
          </div>
        }
      >
        <div className="mt-5 space-y-5 border-t border-border pt-5">
          {role.relevantTechnologies.length ? (
            <div className="flex flex-wrap gap-1.5">
              {role.relevantTechnologies.map((t) => (
                <Badge key={t} tone="primary">{t}</Badge>
              ))}
            </div>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            <List title="Strengths" items={role.strengths} icon={<CircleCheck />} tone="text-success" />
            <List title="Weaknesses" items={role.weaknesses} icon={<CircleMinus />} tone="text-warning" />
            <List title="Missing evidence" items={role.missingEvidence} icon={<SearchX />} tone="text-danger" />
            <List title="Suggestions" items={role.suggestions} icon={<Lightbulb />} tone="text-primary-strong" />
          </div>
          {role.bullets.length ? (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">Bullet quality</p>
              <div className="space-y-3">
                {role.bullets.map((b) => (
                  <BulletCard key={b.index} bullet={b} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No bullet points were found for this role.</p>
          )}
        </div>
      </Expandable>
    </Card>
  );
}

export function ExperienceSection({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <ResultsSection id="experience">
      <SectionHeading id="experience-title" icon={<Briefcase />} title="Experience Analysis" description="How relevant each role is to this job, plus feedback on every bullet. Suggestions only reword what you wrote." />
      {analysis.experienceAnalysis.length ? (
        <div className="space-y-3">
          {analysis.experienceAnalysis.map((r, i) => (
            <RoleCard key={`${r.title}-${i}`} role={r} defaultOpen={i === 0} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Briefcase />} title="No experience entries detected" description='Use a standard "Experience" heading with role titles, dates and bullet points so parsers can read it.' />
      )}
    </ResultsSection>
  );
}
