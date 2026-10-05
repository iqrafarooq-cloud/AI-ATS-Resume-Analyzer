"use client";

import { ArrowLeft, ClipboardList, Copy, Layers, ListChecks, PenLine, UserRound } from "lucide-react";
import Link from "next/link";
import { Tabs } from "radix-ui";
import { BulletWorkspace } from "@/components/improve/bullet-workspace";
import { SkillsAdvicePanel } from "@/components/improve/skills-advice";
import { SummaryWorkspace } from "@/components/improve/summary-workspace";
import { copyText } from "@/components/improve/use-improve";
import { ReadinessCheck } from "@/components/results/readiness";
import { NoAnalysis, ResultsSkeleton } from "@/components/results/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Readiness, ResumeAnalysis } from "@/lib/schemas";
import type { AcceptedChanges } from "@/lib/session";
import { useAcceptedChanges, useAnalysis } from "@/lib/session";

const TABS = [
  { value: "summary", label: "Summary", icon: UserRound },
  { value: "bullets", label: "Experience bullets", icon: PenLine },
  { value: "skills", label: "Skills", icon: Layers },
];

function AcceptedChanges({ analysis }: { analysis: ResumeAnalysis }) {
  const [accepted] = useAcceptedChanges();
  const entries = Object.entries(accepted).map(([id, value]) => {
    if (id === "summary") return { id, label: "Professional summary", original: analysis.resumeFacts.summary, value };
    const [, r, b] = id.split("-").map(Number);
    const role = analysis.experienceAnalysis[r];
    return { id, label: role ? role.title : "Bullet", original: role?.bullets[b]?.text ?? null, value };
  });

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">
          <ListChecks className="size-4 text-primary-strong" aria-hidden /> Your accepted changes
        </h2>
        {entries.length ? (
          <Button size="sm" variant="secondary" onClick={() => copyText(entries.map((e) => `${e.label}:\n${e.value}`).join("\n\n"))}>
            <Copy aria-hidden /> Copy all
          </Button>
        ) : null}
      </div>
      {entries.length ? (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-border bg-surface-2/40 p-4 text-sm">
              <p className="text-xs text-subtle">{e.label}</p>
              {e.original ? <p className="mt-1 text-muted line-through decoration-subtle/60">{e.original}</p> : null}
              <p className="mt-1">{e.value}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<ClipboardList />} title="No changes accepted yet" description='Choose "Use Suggestion" on any rewrite to collect it here, then copy it into your resume.' className="py-6" />
      )}
    </Card>
  );
}

/** Reflect accepted suggestions in the readiness checklist so progress is visible while editing. */
function liveReadiness(analysis: ResumeAnalysis, accepted: AcceptedChanges): Readiness {
  const weak = analysis.experienceAnalysis.flatMap((r) => r.bullets.filter((b) => b.score < 60).map((b) => `bullet-${r.index}-${b.index}`));
  const checklist = analysis.readiness.checklist.map((c) => {
    if (c.label === "Improve summary" && !c.done && accepted.summary) return { ...c, done: true, detail: "Tailored summary accepted." };
    if (c.label === "Strengthen experience bullets" && !c.done && weak.length > 0 && weak.every((id) => accepted[id])) {
      return { ...c, done: true, detail: "All weak bullets updated." };
    }
    return c;
  });
  return { ...analysis.readiness, checklist };
}

export function ImproveWorkspace() {
  const analysis = useAnalysis();
  const [accepted] = useAcceptedChanges();
  if (analysis === undefined) return <ResultsSkeleton />;
  if (analysis === null) return <NoAnalysis />;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link href="/results"><ArrowLeft aria-hidden /> Back to results</Link>
      </Button>
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-strong">Improvement workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Improve your resume for {analysis.jobInsights.title}</h1>
        <p className="mt-3 text-muted">Look over each suggestion before you use it. We only reword what&apos;s already on your resume, so nothing new gets made up.</p>
      </div>

      <Tabs.Root defaultValue="summary">
        <Tabs.List aria-label="Improvement areas" className="mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-1">
          {TABS.map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm text-muted transition-colors hover:text-foreground data-[state=active]:bg-surface-3 data-[state=active]:text-foreground"
            >
              <t.icon className="size-4" aria-hidden /> {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="summary"><SummaryWorkspace analysis={analysis} /></Tabs.Content>
        <Tabs.Content value="bullets"><BulletWorkspace analysis={analysis} /></Tabs.Content>
        <Tabs.Content value="skills"><SkillsAdvicePanel analysis={analysis} /></Tabs.Content>
      </Tabs.Root>

      <div className="mt-6 space-y-6">
        <AcceptedChanges analysis={analysis} />
        <ReadinessCheck score={analysis.scores.overall} readiness={liveReadiness(analysis, accepted)} showCta={false} />
      </div>
    </div>
  );
}
