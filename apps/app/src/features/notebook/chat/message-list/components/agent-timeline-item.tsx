"use client";

import type { ReactNode } from "react";

import { cn } from "@scibly/ui/utils";

interface AgentTimelineItemProps {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AgentTimelineItem({
  icon,
  children,
  className,
}: AgentTimelineItemProps) {
  return (
    <div className={cn("relative flex gap-3.5", className)}>
      <div className="border-hairline bg-ground-soft text-ink-faint relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-0 pr-2 pb-5">{children}</div>
    </div>
  );
}
