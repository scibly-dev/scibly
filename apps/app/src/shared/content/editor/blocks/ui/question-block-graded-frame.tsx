"use client";

import type { QuestionBlockGradedState } from "@/shared/content/editor/assessment/grading/question-block-store/helpers";

import { QA_PRODUCT_TOKENS } from "@scibly/ui/product-tokens";
import { cn } from "@scibly/ui/utils";
import { AlertCircle, Check, X } from "lucide-react";
import { createElement, memo, type ReactNode } from "react";

const GRADED_THEMES = {
  correct: {
    badge: cn(QA_PRODUCT_TOKENS.positiveAction, "shadow-[0_2px_0_0_#46a302]"),
    statusIcon: Check,
  },
  partial: {
    badge: "bg-[#ffc800] text-white shadow-[0_2px_0_0_#e6b400]",
    statusIcon: AlertCircle,
  },
  incorrect: {
    badge: "bg-[#ff4b4b] text-white shadow-[0_2px_0_0_#e03e3e]",
    statusIcon: X,
  },
  unanswered: {
    badge: null,
    statusIcon: null,
  },
} as const;

type QuestionBlockGradedFrameProps = {
  state: QuestionBlockGradedState | null;
  variant?: "block" | "inline";
  className?: string;

  missingSolution?: string | null;
  children: ReactNode;
};

const MISSING_SOLUTION_FACE =
  "text-amber-700 dark:text-amber-300 text-[11px] leading-tight font-medium";

export const QuestionBlockGradedFrame = memo(
  (props: QuestionBlockGradedFrameProps) => {
    const {
      state,
      variant = "block",
      className,
      missingSolution,
      children,
    } = props;
    const theme = state ? GRADED_THEMES[state] : null;
    const isInline = variant === "inline";
    const statusIcon = theme?.statusIcon ?? null;

    if (!state && !className && !missingSolution) {
      return <>{children}</>;
    }

    const shellClassName = cn(
      "relative",
      isInline ? "inline-flex max-w-full align-middle" : "w-full",
      className,
    );

    const badge =
      theme?.badge && statusIcon ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-10 flex items-center justify-center rounded-full",
            theme.badge,
            isInline
              ? "-top-1.5 -right-1.5 h-4 w-4"
              : "-top-2 -right-2 h-6 w-6",
          )}
        >
          {statusIcon
            ? createElement(statusIcon, {
                className: isInline ? "h-2.5 w-2.5" : "h-3.5 w-3.5",
                strokeWidth: 3,
              })
            : null}
        </span>
      ) : null;

    if (isInline) {
      const shell = (
        <span className={shellClassName}>
          {badge}
          {children}
        </span>
      );

      return missingSolution ? (
        <span className="inline-flex flex-wrap items-center gap-1 align-middle">
          {shell}
          <span
            contentEditable={false}
            className={cn(
              "inline-flex shrink-0 items-center gap-1",
              MISSING_SOLUTION_FACE,
            )}
          >
            <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            {missingSolution}
          </span>
        </span>
      ) : (
        shell
      );
    }

    const shell = (
      <div className={shellClassName}>
        {badge}
        {children}
      </div>
    );

    return missingSolution ? (
      <div className="w-full">
        {shell}
        <span
          contentEditable={false}
          className={cn("mt-1.5 flex items-start gap-1", MISSING_SOLUTION_FACE)}
        >
          <AlertCircle className="mt-px h-3 w-3 shrink-0" strokeWidth={2.5} />
          {missingSolution}
        </span>
      </div>
    ) : (
      shell
    );
  },
);
QuestionBlockGradedFrame.displayName = "QuestionBlockGradedFrame";
