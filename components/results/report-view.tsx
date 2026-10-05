"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { SECTION_LABEL } from "@/components/results/findings";
import { LEVEL_TEXT, NoAnalysis, ResultsSkeleton } from "@/components/results/shared";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/lib/session";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-8 border-b border-border pb-1.5 text-base font-semibold">{children}</h2>;
}

export function ReportView() {
  const a = useAnalysis();
  if (a === undefined) return <ResultsSkeleton />;
  if (a === null) return <NoAnalysis />;
  const s = a.scores;
  const rows: [string, number, number][] = [
    ["Job Match", s.jobMatch, s.weights.jobMatch],
    ["Keyword Alignment", s.keyword, s.weights.keyword],
    ["Skills Alignment", s.skills, s.weights.skills],
    ["Experience Relevance", s.experience, s.weights.experience],
    ["ATS Compatibility", s.ats, s.weights.ats],
    ["Resume Quality", s.resumeQuality, s.weights.resumeQuality],
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <div className="no-print mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/results"><ArrowLeft aria-hidden /> Back to results</Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer aria-hidden /> Print / Save as PDF
        </Button>
      </div>

      <article className="rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed sm:p-10 print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-subtle">ResumePilot analysis report</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{a.jobInsights.title}</h1>
            <p className="mt-1 text-muted">{a.fileName} <span aria-hidden>&middot;</span> {new Date(a.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold tabular-nums">{s.overall}<span className="text-base text-subtle">/100</span></p>
            <p className="font-medium text-primary-strong">{s.label}</p>
          </div>
        </header>
        <p className="mt-5 text-muted">{a.summary}</p>

        <H>Score breakdown</H>
        <table className="w-full text-left">
          <thead><tr className="text-xs text-subtle"><th className="py-1 font-medium">Dimension</th><th className="py-1 font-medium">Weight</th><th className="py-1 text-right font-medium">Score</th></tr></thead>
          <tbody>
            {rows.map(([label, v, w]) => (
              <tr key={label} className="border-t border-border/60"><td className="py-1.5">{label}</td><td className="py-1.5 text-muted">{Math.round(w * 100)}%</td><td className="py-1.5 text-right font-medium tabular-nums">{v}</td></tr>
            ))}
          </tbody>
        </table>

        <H>Priority actions</H>
        <ol className="list-decimal space-y-2 pl-5">
          {a.priorityActions.map((p) => (
            <li key={p.id} className="print-break">
              <span className="font-medium">{p.title}</span> <span className="text-xs text-subtle">({p.impact} impact, {SECTION_LABEL[p.section]})</span>
              <p className="text-muted">{p.whatToChange} {p.whyItMatters}</p>
            </li>
          ))}
        </ol>

        <H>Job match</H>
        <table className="w-full text-left">
          <tbody>
            {a.jobRequirements.map((r, i) => (
              <tr key={i} className="border-t border-border/60 align-top print-break"><td className="py-1.5 pr-3">{r.requirement}</td><td className="py-1.5 pr-3 text-muted">{LEVEL_TEXT[r.level]}</td><td className="py-1.5 text-muted">{r.note}</td></tr>
            ))}
          </tbody>
        </table>

        <H>Keyword analysis</H>
        <p><span className="font-medium">Matched:</span> <span className="text-muted">{a.matchedKeywords.map((k) => k.term).join(", ") || "None"}</span></p>
        <p className="mt-1"><span className="font-medium">Underused:</span> <span className="text-muted">{a.underusedKeywords.map((k) => k.term).join(", ") || "None"}</span></p>
        <p className="mt-1"><span className="font-medium">Missing:</span> <span className="text-muted">{a.missingKeywords.map((k) => k.term).join(", ") || "None"}</span></p>

        <H>Skills gap</H>
        <p><span className="font-medium">Strong:</span> <span className="text-muted">{a.skillsAnalysis.strong.map((k) => k.skill).join(", ") || "None"}</span></p>
        <p className="mt-1"><span className="font-medium">Partial:</span> <span className="text-muted">{a.skillsAnalysis.partial.map((k) => k.skill).join(", ") || "None"}</span></p>
        <p className="mt-1"><span className="font-medium">Missing:</span> <span className="text-muted">{a.skillsAnalysis.missing.map((k) => k.skill).join(", ") || "None"}</span></p>

        <H>Experience analysis</H>
        {a.experienceAnalysis.map((r) => (
          <div key={r.index} className="mb-3 print-break">
            <p className="font-medium">{r.title}{r.company ? `, ${r.company}` : ""} <span className="text-xs text-subtle">- {r.matchPercent}% match, bullet quality {r.bulletQuality}</span></p>
            {[...r.strengths, ...r.weaknesses.map((w) => `Weakness: ${w}`)].map((t) => <p key={t} className="text-muted">- {t}</p>)}
          </div>
        ))}

        <H>ATS compatibility ({a.ats.score}/100)</H>
        {a.ats.issues.length ? (
          <ul className="list-disc space-y-1 pl-5">{a.ats.issues.map((i) => <li key={i.id}><span className="font-medium">{i.title}</span> <span className="text-muted">- {i.detail}</span></li>)}</ul>
        ) : (
          <p className="text-muted">No major ATS compatibility issues detected.</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <H>Strengths</H>
            <ul className="list-disc space-y-1 pl-5">{a.strengths.map((x) => <li key={x.title}><span className="font-medium">{x.title}</span> <span className="text-muted">- {x.detail}</span></li>)}</ul>
          </div>
          <div>
            <H>Weaknesses</H>
            <ul className="list-disc space-y-1 pl-5">{a.weaknesses.map((x) => <li key={x.title}><span className="font-medium">{x.title}</span> <span className="text-muted">- {x.detail}</span></li>)}</ul>
          </div>
        </div>

        <p className="mt-10 text-xs text-subtle">Generated by ResumePilot. Scores are a guide, not a prediction of how a specific applicant tracking system will rank you. Recruiter priorities are our best guess from the job post.</p>
      </article>
    </div>
  );
}
