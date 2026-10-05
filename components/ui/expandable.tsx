"use client";

import { ChevronDown } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Expandable({
  trigger,
  children,
  defaultOpen = false,
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={className}>
      <Collapsible.Trigger className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-ring">
        <div className="min-w-0 flex-1">{trigger}</div>
        <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </Collapsible.Trigger>
      <Collapsible.Content>{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
