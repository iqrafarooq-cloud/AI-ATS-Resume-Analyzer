"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ImproveRequest, ImprovementResponse, ResumeAnalysis } from "@/lib/schemas";

export function useImprove(analysis: ResumeAnalysis) {
  const [pending, setPending] = useState<string | null>(null);

  async function improve(id: string, kind: ImproveRequest["kind"], original: string, previousSuggestion: string | null) {
    setPending(id);
    try {
      const body: ImproveRequest = {
        kind,
        original,
        previousSuggestion,
        jobTitle: analysis.jobInsights.title,
        jobKeywords: analysis.jobInsights.keywords.map((k) => k.term).slice(0, 40),
        resumeFacts: analysis.resumeFacts,
      };
      const res = await fetch("/api/improve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => null)) as (ImprovementResponse & { mode: string }) | { error?: { message?: string } } | null;
      if (!res.ok || !data || "error" in data) {
        throw new Error((data && "error" in data && data.error?.message) || "Couldn't generate a suggestion.");
      }
      return data as ImprovementResponse;
    } catch (e) {
      toast.error("Suggestion failed", { description: e instanceof TypeError ? "Couldn't connect. Please try again." : e instanceof Error ? e.message : undefined });
      return null;
    } finally {
      setPending(null);
    }
  }

  return { improve, pending };
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Couldn't access the clipboard");
  }
}
