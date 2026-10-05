"use client";

import { Check, Copy, ListX, Loader2, RefreshCw, Sparkles, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { copyText, useImprove } from "@/components/improve/use-improve";
import type { ResumeAnalysis } from "@/lib/schemas";
import { useAcceptedChanges } from "@/lib/session";
import { cn, scoreTone, TONE_TEXT } from "@/lib/utils";

interface BulletItem {
  id: string;
  role: string;
  text: string;
  score: number;
  suggestion: string | null;
  rationale: string | null;
}

export function BulletWorkspace({ analysis }: { analysis: ResumeAnalysis }) {
  const items = useMemo<BulletItem[]>(
    () =>
      analysis.experienceAnalysis
        .flatMap((r) =>
          r.bullets.map((b) => ({
            id: `bullet-${r.index}-${b.index}`,
            role: [r.title, r.company].filter(Boolean).join(" at "),
            text: b.text,
            score: b.score,
            suggestion: b.suggestion,
            rationale: b.rationale,
          })),
        )
        .sort((a, b) => a.score - b.score),
    [analysis],
  );

  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const [overrides, setOverrides] = useState<Record<string, { suggestion: string; rationale: string }>>({});
  const [accepted, setChange] = useAcceptedChanges();
  const { improve, pending } = useImprove(analysis);

  if (!items.length) {
    return <EmptyState icon={<ListX />} title="No improvement suggestions" description="We couldn't find experience bullets to improve. Make sure your roles use bullet points." />;
  }

  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const suggestion = overrides[selected.id]?.suggestion ?? selected.suggestion;
  const rationale = overrides[selected.id]?.rationale ?? selected.rationale;
  const acceptedValue = accepted[selected.id];

  async function regenerate() {
    const res = await improve(selected.id, "bullet", selected.text, suggestion);
    if (res) {
      setOverrides((o) => ({ ...o, [selected.id]: { suggestion: res.suggestion, rationale: res.rationale } }));
      toast.success("New suggestion generated");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card className="p-2">
        <p className="px-3 pb-2 pt-3 text-xs font-medium uppercase tracking-wider text-subtle">Select a bullet (weakest first)</p>
        <ul className="max-h-[560px] space-y-1 overflow-y-auto" role="listbox" aria-label="Experience bullets">
          {items.map((item) => {
            const active = item.id === selected.id;
            return (
              <li key={item.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn("w-full cursor-pointer rounded-xl px-3 py-2.5 text-left transition-colors", active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-surface-2")}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="line-clamp-2 text-sm">{item.text}</span>
                    <span className={cn("shrink-0 text-xs font-semibold tabular-nums", TONE_TEXT[scoreTone(item.score)])}>{item.score}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-2 truncate text-xs text-subtle">
                    {item.role}
                    {accepted[item.id] ? <Badge tone="success" className="px-1.5 py-0">Updated</Badge> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-5 sm:p-6">
        <p className="mb-4 text-sm text-muted">{selected.role}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Original</p>
            <p className="text-sm leading-relaxed">{selected.text}</p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/[0.05] p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
              <Sparkles className="size-3.5" aria-hidden /> Suggested
            </p>
            {pending === selected.id ? (
              <p className="flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Rewriting while preserving facts...</p>
            ) : suggestion ? (
              <p className="text-sm leading-relaxed">{suggestion}</p>
            ) : (
              <p className="text-sm text-muted">No rewrite yet. Generate one below.</p>
            )}
          </div>
        </div>
        {rationale ? <p className="mt-3 text-sm text-muted">{rationale}</p> : null}
        <p className="mt-2 text-xs text-subtle">Suggestions never add metrics, tools or responsibilities you didn&apos;t mention. Consider adding a metric if you have one.</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {suggestion ? (
            acceptedValue === suggestion ? (
              <Button size="sm" variant="secondary" onClick={() => setChange(selected.id, null)}>
                <Undo2 aria-hidden /> Undo
              </Button>
            ) : (
              <Button size="sm" onClick={() => { setChange(selected.id, suggestion); toast.success("Suggestion saved to your changes"); }}>
                <Check aria-hidden /> Use Suggestion
              </Button>
            )
          ) : null}
          <Button size="sm" variant="secondary" onClick={regenerate} disabled={pending !== null}>
            <RefreshCw aria-hidden /> {suggestion ? "Regenerate" : "Generate"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setChange(selected.id, null); toast("Keeping your original bullet"); }}>
            Keep Original
          </Button>
          {suggestion ? (
            <Button size="sm" variant="ghost" onClick={() => copyText(suggestion)}>
              <Copy aria-hidden /> Copy
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
