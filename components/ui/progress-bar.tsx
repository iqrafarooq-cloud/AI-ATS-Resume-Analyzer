"use client";

import { motion } from "framer-motion";
import { cn, scoreTone, TONE_BG, type Tone } from "@/lib/utils";

export function ProgressBar({
  value,
  tone,
  className,
  label,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const t = tone ?? scoreTone(value);
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <motion.div
        className={cn("h-full rounded-full", TONE_BG[t])}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(2, value)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
