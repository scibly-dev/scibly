import type { DisplayedGrade } from "@/shared/content/contracts";

import {
  isCorrect,
  isPartiallyCorrect,
} from "@/shared/content/editor/assessment/grading/question-block-store/helpers";

export type SceneFeedbackStatus = "perfect" | "partial" | "incorrect";

export type SceneFeedbackSummary = {
  status: SceneFeedbackStatus;
  correctCount: number;
  totalCount: number;
};

export function buildSceneFeedbackSummary(
  gradedBlocks: DisplayedGrade[],
): SceneFeedbackSummary | null {
  const scored = gradedBlocks.filter((grade) => grade.maxPoints > 0);
  if (scored.length === 0) return null;

  let correctCount = 0;
  let partialCount = 0;

  scored.forEach((grade) => {
    if (isCorrect(grade.achievedPoints, grade.maxPoints)) {
      correctCount++;
      return;
    }

    if (isPartiallyCorrect(grade.achievedPoints, grade.maxPoints)) {
      partialCount++;
    }
  });

  const totalCount = scored.length;
  let status: SceneFeedbackStatus;
  if (correctCount === totalCount) {
    status = "perfect";
  } else if (correctCount === 0 && partialCount === 0) {
    status = "incorrect";
  } else {
    status = "partial";
  }

  return {
    status,
    correctCount,
    totalCount,
  };
}
