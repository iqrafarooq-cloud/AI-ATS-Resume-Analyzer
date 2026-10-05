"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useId } from "react";
import { cn, scoreTone, TONE_VAR } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 180,
  stroke = 12,
  className,
  showTotal = true,
}: {
  score: number;
  size?: number;
  stroke?: number;
  className?: string;
  showTotal?: boolean;
}) {
  const id = useId();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useMotionValue(0);
  const offset = useTransform(progress, (v) => circumference - (v / 100) * circumference);
  const display = useTransform(progress, (v) => Math.round(v).toString());
  const color = TONE_VAR[scoreTone(score)];

  useEffect(() => {
    const controls = animate(progress, score, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [progress, score]);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${score} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <motion.span className="font-semibold tabular-nums leading-none tracking-tight text-foreground" style={{ fontSize: size * 0.28 }}>
          {display}
        </motion.span>
        {showTotal ? (
          <span className="mt-1 text-subtle" style={{ fontSize: Math.max(11, size * 0.075) }}>
            / 100
          </span>
        ) : null}
      </div>
    </div>
  );
}
