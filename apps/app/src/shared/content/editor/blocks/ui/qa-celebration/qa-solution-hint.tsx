"use client";

import { cn } from "@scibly/ui/utils";
import { ArrowRight } from "lucide-react";
import { memo, type ReactNode } from "react";

import { getGradedTileClassName } from "@/shared/content/editor/blocks/ui/qa-celebration/qa-celebration-tokens";

type QASolutionHintProps = {
  label?: string;
  children: ReactNode;
  className?: string;
  variant?: "inline" | "chip";
};

export const QASolutionHint = memo((props: QASolutionHintProps) => {
  const { label, children, className, variant = "inline" } = props;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 align-middle",
        className,
      )}
    >
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 text-neutral-400"
        aria-hidden
      />
      {label ? (
        <span className="shrink-0 text-[11px] font-bold tracking-wide text-[#b8860b] uppercase dark:text-amber-400">
          {label}
        </span>
      ) : null}
      <span
        className={cn(
          variant === "chip"
            ? getGradedTileClassName("missed", "px-2.5 py-1 text-[13px]")
            : "text-[13px] font-semibold text-[#3f8712] dark:text-green-400",
        )}
      >
        {children}
      </span>
    </span>
  );
});
QASolutionHint.displayName = "QASolutionHint";
