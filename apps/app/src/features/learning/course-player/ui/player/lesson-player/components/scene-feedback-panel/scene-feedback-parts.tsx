"use client";

import type { SceneFeedbackSummary } from "../../utils/scene-feedback-summary";

import { cn } from "@scibly/ui/utils";
import { Check, X } from "lucide-react";

import { type FEEDBACK_THEMES } from "./scene-feedback-themes";

export type FeedbackTranslations = {
  perfectTitle: string;
  partialTitle: string;
  incorrectTitle: string;
  scoreSummary: string;
};

type FeedbackTheme = (typeof FEEDBACK_THEMES)[keyof typeof FEEDBACK_THEMES];

export function getFeedbackTitle(
  summary: SceneFeedbackSummary,
  t: FeedbackTranslations,
): string {
  if (summary.status === "perfect") return t.perfectTitle;
  if (summary.status === "incorrect") return t.incorrectTitle;
  return t.partialTitle;
}

export function FeedbackHeader({
  summary,
  theme,
  title,
  showScore,
  t,
}: {
  summary: SceneFeedbackSummary;
  theme: FeedbackTheme;
  title: string;
  showScore: boolean;
  t: FeedbackTranslations;
}) {
  return (
    <div className="flex shrink-0 items-start gap-3.5 @min-[40rem]:gap-4">
      <div className="shrink-0 pb-1">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full @min-[40rem]:h-12 @min-[40rem]:w-12",
            theme.iconBg,
          )}
        >
          {summary.status === "perfect" ? (
            <Check className="h-5 w-5 stroke-3 text-white @min-[40rem]:h-6 @min-[40rem]:w-6" />
          ) : (
            <X className="h-5 w-5 stroke-3 text-white @min-[40rem]:h-6 @min-[40rem]:w-6" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={cn(
            "text-xl leading-tight font-extrabold tracking-tight @min-[40rem]:text-2xl",
            theme.title,
          )}
        >
          {title}
        </p>

        {showScore ? (
          <p
            className={cn(
              "mt-1 text-sm font-bold @min-[40rem]:text-base",
              theme.subtitle,
            )}
          >
            {t.scoreSummary
              .replace("{{correct}}", String(summary.correctCount))
              .replace("{{total}}", String(summary.totalCount))}
          </p>
        ) : null}
      </div>
    </div>
  );
}
