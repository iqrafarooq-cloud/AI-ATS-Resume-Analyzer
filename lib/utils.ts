import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type Tone = "success" | "primary" | "warning" | "danger";

export function scoreTone(score: number): Tone {
  if (score >= 80) return "success";
  if (score >= 70) return "primary";
  if (score >= 60) return "warning";
  return "danger";
}

export const TONE_TEXT: Record<Tone, string> = {
  success: "text-success",
  primary: "text-primary-strong",
  warning: "text-warning",
  danger: "text-danger",
};

export const TONE_BG: Record<Tone, string> = {
  success: "bg-success",
  primary: "bg-primary",
  warning: "bg-warning",
  danger: "bg-danger",
};

export const TONE_VAR: Record<Tone, string> = {
  success: "var(--success)",
  primary: "var(--primary)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

export function shortLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Moderate";
  return "Needs work";
}
