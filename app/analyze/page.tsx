import type { Metadata } from "next";
import { AnalyzeWorkspace } from "@/components/analyze/analyze-workspace";

export const metadata: Metadata = { title: "Analyze" };

export default function AnalyzePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-strong">Analysis workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Match your resume to the job</h1>
        <p className="mt-3 text-muted">Upload your resume and paste the job description. We&apos;ll score the match, find gaps and build your action plan.</p>
      </div>
      <AnalyzeWorkspace />
    </div>
  );
}
