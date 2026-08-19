"use client";

import type { SceneFeedbackSummary } from "../../utils/scene-feedback-summary";

import {
  FeedbackHeader,
  type FeedbackTranslations,
  getFeedbackTitle,
} from "./scene-feedback-parts";
import { FEEDBACK_THEMES } from "./scene-feedback-themes";

export { FEEDBACK_THEMES } from "./scene-feedback-themes";

interface SceneFeedbackContentProps {
  summary: SceneFeedbackSummary;
  t: FeedbackTranslations;
}

export function SceneFeedbackContent({
  summary,
  t,
}: SceneFeedbackContentProps) {
  const theme = FEEDBACK_THEMES[summary.status];
  const title = getFeedbackTitle(summary, t);
  const showScore = summary.totalCount > 1 && summary.status !== "perfect";

  return (
    <FeedbackHeader
      summary={summary}
      theme={theme}
      title={title}
      showScore={showScore}
      t={t}
    />
  );
}

export function getFeedbackTheme(status: SceneFeedbackSummary["status"]) {
  return FEEDBACK_THEMES[status];
}
