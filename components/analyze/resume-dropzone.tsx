"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, RefreshCw, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function validateResumeFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".doc")) return "Legacy .doc files aren't supported. Please save as .docx or PDF.";
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) return "Unsupported file type. Please upload a PDF or DOCX resume.";
  if (file.size === 0) return "This file is empty. Please choose another resume.";
  if (file.size > MAX_BYTES) return "Resume files must be 5 MB or smaller.";
  return null;
}

export function ResumeDropzone({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (f: File | undefined) => {
    if (!f) return;
    const problem = validateResumeFile(f);
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }
    setError(null);
    onChange(f);
    toast.success("Resume uploaded", { description: f.name });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files?.[0]);
  };

  const kind = file?.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOCX";

  return (
    <div className="flex h-full flex-col">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        id="resume-file"
        aria-describedby="resume-help"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        {file ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex min-h-64 flex-col justify-center rounded-2xl border border-success/30 bg-success/[0.04] p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary-strong">
                <FileText className="size-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium" title={file.name}>{file.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {kind} <span aria-hidden>&middot;</span> {formatBytes(file.size)}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle2 className="size-4" aria-hidden /> Ready to analyze
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                <RefreshCw aria-hidden /> Replace
              </Button>
              <Button variant="danger" size="sm" onClick={() => onChange(null)}>
                <Trash2 aria-hidden /> Remove
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.label
            key="drop"
            htmlFor="resume-file"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={cn(
              "flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all",
              dragging ? "border-primary bg-primary/[0.06]" : "border-border-strong hover:border-primary/50 hover:bg-surface-2/50",
              error && "border-danger/50",
            )}
          >
            <motion.div animate={{ y: dragging ? -4 : 0 }} className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary-strong">
              <UploadCloud className="size-7" aria-hidden />
            </motion.div>
            <p className="font-medium">
              {dragging ? "Drop your resume here" : <>Drag and drop, or <span className="text-primary-strong underline-offset-4 hover:underline">browse files</span></>}
            </p>
            <p className="mt-1.5 text-sm text-muted">PDF or DOCX, up to 5 MB</p>
          </motion.label>
        )}
      </AnimatePresence>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">{error}</p>
      ) : null}
      <p id="resume-help" className="mt-auto flex pt-4 items-start gap-2 text-xs text-subtle">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-accent" aria-hidden />
        Your resume is processed for this analysis and is not stored in a personal database.
      </p>
    </div>
  );
}
