"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ResumeAnalysis } from "@/lib/schemas";

/**
 * Session-only storage. Analysis results live in sessionStorage for this browser tab
 * and disappear when it closes. Nothing is persisted server-side.
 */
const ANALYSIS_KEY = "resumepilot:analysis";
const ACCEPTED_KEY = "resumepilot:accepted";

export type AcceptedChanges = Record<string, string>;

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read<T>(key: string): T | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T | null;
  let value: T | null = null;
  try {
    value = raw ? (JSON.parse(raw) as T) : null;
  } catch {
    value = null;
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode); the current page still works.
  }
  emit();
}

export function saveAnalysis(analysis: ResumeAnalysis) {
  write(ANALYSIS_KEY, analysis);
  write(ACCEPTED_KEY, {});
}

export function clearSession() {
  write(ANALYSIS_KEY, null);
  write(ACCEPTED_KEY, null);
}

/** Returns `undefined` during SSR/hydration, `null` when no analysis exists. */
export function useAnalysis(): ResumeAnalysis | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => read<ResumeAnalysis>(ANALYSIS_KEY),
    () => undefined,
  );
}

const EMPTY: AcceptedChanges = {};

export function useAcceptedChanges() {
  const accepted = useSyncExternalStore(
    subscribe,
    () => read<AcceptedChanges>(ACCEPTED_KEY) ?? EMPTY,
    () => EMPTY,
  );
  const setChange = useCallback((id: string, value: string | null) => {
    const next = { ...(read<AcceptedChanges>(ACCEPTED_KEY) ?? {}) };
    if (value === null) delete next[id];
    else next[id] = value;
    write(ACCEPTED_KEY, next);
  }, []);
  return [accepted, setChange] as const;
}
