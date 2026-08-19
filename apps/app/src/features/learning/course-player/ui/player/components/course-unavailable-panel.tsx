"use client";

import type { ReactNode } from "react";

import { cn } from "@scibly/ui/utils";

export function CourseUnavailablePanel({
  icon,
  tileClassName,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  tileClassName: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(50*var(--player-vh,1vh))] w-full max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl",
          tileClassName,
        )}
      >
        {icon}
      </div>
      <div className="grid gap-2">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
