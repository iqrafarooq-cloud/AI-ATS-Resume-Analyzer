import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-border bg-surface", className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
  className,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-start gap-3", className)}>
      {icon ? (
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-surface-2 text-primary-strong [&_svg]:size-4">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">{eyebrow}</p> : null}
        <h2 id={id} className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
    </div>
  );
}
