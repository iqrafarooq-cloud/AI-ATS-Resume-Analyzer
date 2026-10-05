"use client";

import { Check, Copy, FileText, Loader2, RefreshCw, Sparkles, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { copyText, useImprove } from "@/components/improve/use-improve";
import type { ResumeAnalysis } from "@/lib/schemas";
import { useAcceptedChanges } from "@/lib/session";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-subtle">{children}</p>;
}

export function SummaryWorkspace({ analysis }: { analysis: ResumeAnalysis }) {
  const base = analysis.resumeImprovements.summary;
  const [suggested, setSuggested] = useState<string | null>(base.suggested);
  const [notes, setNotes] = useState<string[]>(base.analysis);
  const [accepted, setChange] = useAcceptedChanges();
  const { improve, pending } = useImprove(analysis);
  const isAccepted = suggested !== null && accepted.summary === suggested;

  async function regenerate() {
    const res = await improve("summary", "summary", base.original ?? "", suggested);
    if (res) {
      setSuggested(res.suggestion);
      if (res.analysis.length) setNotes(res.analysis);
      toast.success("New summary generated");
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-6">
        <div>
          <Label>Current Summary</Label>
          {base.original ? (
            <p className="rounded-2xl border border-border bg-surface-2/40 p-4 text-sm leading-relaxed text-muted">{base.original}</p>
          ) : (
            <EmptyState icon={<FileText />} title="No summary on your resume" description="A short, tailored summary helps recruiters see your fit at a glance." className="py-6" />
          )}
        </div>

        <div>
          <Label>Analysis</Label>
          <ul className="space-y-1.5">
            {notes.map((n) => (
              <li key={n} className="flex gap-2 text-sm text-muted">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary-strong" />
                {n}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Label>Suggested Version</Label>
          {suggested ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.05] p-4">
              <p className="text-sm leading-relaxed">{suggested}</p>
              <p className="mt-3 text-xs text-subtle">Built only from facts in your resume. Review it and adjust anything that doesn&apos;t sound like you.</p>
            </div>
          ) : (
            <EmptyState icon={<Sparkles />} title="No suggestion yet" description="Generate a tailored summary based on your experience." className="py-6" />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {suggested ? (
              <>
                <Button size="sm" variant={isAccepted ? "secondary" : "primary"} onClick={() => { setChange("summary", isAccepted ? null : suggested); toast.success(isAccepted ? "Suggestion removed" : "Summary saved to your changes"); }}>
                  {isAccepted ? <><Undo2 aria-hidden /> Undo</> : <><Check aria-hidden /> Use Suggestion</>}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => copyText(suggested)}>
                  <Copy aria-hidden /> Copy
                </Button>
              </>
            ) : null}
            <Button size="sm" variant="ghost" onClick={regenerate} disabled={pending === "summary"}>
              {pending === "summary" ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
              {suggested ? "Regenerate" : "Generate"}
            </Button>
            {isAccepted ? <Badge tone="success" className="self-center">Using suggestion</Badge> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
