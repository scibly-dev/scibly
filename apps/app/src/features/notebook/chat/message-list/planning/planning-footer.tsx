"use client";

import { chipRestClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowRight } from "lucide-react";

import { notebookPrimaryButton } from "../../../workspace/components/notebook-shell";

interface PlanningFooterProps {
  stepCountLabel: string;
  showStepCount: boolean;
  denyLabel: string;
  confirmLabel: string;
  disabled?: boolean;
  canConfirm: boolean;
  onDeny: () => void;
  onConfirm: () => void;
}

export function PlanningFooter({
  stepCountLabel,
  showStepCount,
  denyLabel,
  confirmLabel,
  disabled,
  canConfirm,
  onDeny,
  onConfirm,
}: PlanningFooterProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span
        aria-hidden={showStepCount && !stepCountLabel}
        className={cn(
          "text-sm text-neutral-500 dark:text-neutral-400",
          !showStepCount && "hidden",
        )}
      >
        {stepCountLabel}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onDeny}
          className={cn(
            "ease-press rounded-xl border-2 px-4 py-1.5 text-sm font-semibold transition-[translate,box-shadow,border-color,color] duration-100 active:translate-y-[3px] active:shadow-none",
            chipRestClass,
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 dark:shadow-none",
          )}
        >
          {denyLabel}
        </button>

        <button
          type="button"
          disabled={disabled || !canConfirm}
          onClick={onConfirm}
          aria-label={confirmLabel}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold",
            notebookPrimaryButton,
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <span className="hidden sm:inline">{confirmLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
