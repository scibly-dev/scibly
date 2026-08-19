"use client";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { RotateCcw } from "lucide-react";
import { memo } from "react";

type QALearnerResetButtonProps = {
  visible: boolean;
  onReset: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export const QALearnerResetButton = memo(
  ({
    visible,
    onReset,
    label,
    disabled = false,
    className,
  }: QALearnerResetButtonProps) => {
    if (!visible) {
      return null;
    }

    if (label) {
      return (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onReset}
          className={cn(
            "h-7 rounded-lg text-neutral-500 hover:text-neutral-900 @min-[40rem]:h-8 dark:hover:text-neutral-100",
            className,
          )}
        >
          <RotateCcw className="mr-1.5 h-3 w-3 @min-[40rem]:h-3.5 @min-[40rem]:w-3.5" />
          {label}
        </Button>
      );
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        disabled={disabled}
        className={cn(
          "h-7 w-7 text-neutral-500 hover:text-neutral-700 @min-[40rem]:h-8 @min-[40rem]:w-8 dark:hover:text-neutral-300",
          className,
        )}
        aria-label="Reset selection"
      >
        <RotateCcw className="h-3.5 w-3.5 @min-[40rem]:h-4 @min-[40rem]:w-4" />
      </Button>
    );
  },
);

QALearnerResetButton.displayName = "QALearnerResetButton";
