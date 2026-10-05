import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="rp-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary-strong)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#rp-logo)" />
      <path d="M10 22V10h6.2a4.3 4.3 0 0 1 0 8.6H10" fill="none" stroke="#0b0a1a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m16.5 18.6 5 3.4" stroke="#0b0a1a" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">ResumePilot</span>
    </span>
  );
}
