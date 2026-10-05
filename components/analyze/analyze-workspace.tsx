"use client";

import { AnimatePresence } from "framer-motion";
import { ArrowRight, CircleAlert, FileText, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AnalysisProgress } from "@/components/analyze/analysis-progress";
import { JobInput, MIN_JOB_WORDS } from "@/components/analyze/job-input";
import { ResumeDropzone } from "@/components/analyze/resume-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ResumeAnalysis } from "@/lib/schemas";
import { saveAnalysis } from "@/lib/session";
import { wordCount } from "@/lib/text";

type Status = "idle" | "running" | "finishing";

export function AnalyzeWorkspace() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const jobReady = wordCount(job) >= MIN_JOB_WORDS;
  const canAnalyze = Boolean(file) && jobReady && status === "idle";

  async function analyze() {
    if (!file || !jobReady) return;
    setError(null);
    setStatus("running");
    try {
      const body = new FormData();
      body.append("resume", file);
      body.append("jobDescription", job);
      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as ResumeAnalysis | { error?: { message?: string } } | null;
      if (!res.ok || !data || "error" in data) {
        const message = (data && "error" in data && data.error?.message) || "Analysis failed. Please try again.";
        throw new Error(message);
      }
      saveAnalysis(data as ResumeAnalysis);
      setStatus("finishing");
      toast.success("Analysis complete", { description: `${(data as ResumeAnalysis).scores.overall}/100 - ${(data as ResumeAnalysis).scores.label}` });
      window.setTimeout(() => router.push("/results"), 700);
    } catch (e) {
      const message = e instanceof TypeError ? "Couldn't connect. Check your internet connection and try again." : e instanceof Error ? e.message : "Analysis failed.";
      setError(message);
      toast.error("Analysis failed", { description: message });
      setStatus("idle");
    }
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col p-5 sm:p-6">
          <PanelTitle icon={<FileText />} step="1" title="Your Resume" subtitle="Upload the version you plan to send." />
          <ResumeDropzone file={file} onChange={setFile} />
        </Card>
        <Card className="flex flex-col p-5 sm:p-6">
          <PanelTitle icon={<Target />} step="2" title="Target Job" subtitle="Paste the job description you're applying to." />
          <JobInput value={job} onChange={setJob} />
        </Card>
      </div>

      {error ? (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/[0.06] p-4 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex flex-col items-center gap-2 bg-gradient-to-t from-background from-60% to-transparent px-4 pb-4 pt-8 sm:-mx-6 sm:px-6">
        <Button size="lg" className="w-full max-w-sm" disabled={!canAnalyze} onClick={analyze}>
          Analyze Resume <ArrowRight aria-hidden />
        </Button>
        {!canAnalyze && status === "idle" ? (
          <p className="text-xs text-subtle">
            {!file && !jobReady ? "Upload a resume and paste a job description to continue." : !file ? "Upload your resume to continue." : "Paste a job description to continue."}
          </p>
        ) : null}
      </div>

      <AnimatePresence>{status !== "idle" ? <AnalysisProgress done={status === "finishing"} /> : null}</AnimatePresence>
    </>
  );
}

function PanelTitle({ icon, step, title, subtitle }: { icon: React.ReactNode; step: string; title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl border border-border-strong bg-surface-2 text-primary-strong [&_svg]:size-5">{icon}</div>
      <div>
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="font-mono text-xs text-subtle">0{step}</span> {title}
        </h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}
