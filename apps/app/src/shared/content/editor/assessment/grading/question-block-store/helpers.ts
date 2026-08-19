import type { AnyInternalQuestionBlock } from "@/shared/content/editor/assessment/parsing/base-parser/types";

import { isNullOrUndefined } from "@/lib/utils";
import { EditableState } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";

export const unanswered = (
  isEditorEditable: boolean,
  block?: AnyInternalQuestionBlock,
) => !isEditorEditable && block && !block.isAnswered;

export type Points = {
  achievedPoints?: number | null;
  maxPoints?: number | null;
};

export type QuestionBlockGradedState =
  | "correct"
  | "partial"
  | "incorrect"
  | "unanswered";

const getPointsObject = (
  achievedPoints?: number,
  maxPoints?: number,
): Points => {
  return { achievedPoints, maxPoints };
};

export const hasGradedPoints = (
  points: Points,
): points is { achievedPoints: number; maxPoints: number } => {
  return (
    !isNullOrUndefined(points.achievedPoints) &&
    !isNullOrUndefined(points.maxPoints)
  );
};

export const isCorrect = (achievedPoints: number, totalPoints: number) =>
  achievedPoints === totalPoints;

export const isPartiallyCorrect = (
  achievedPoints: number,
  totalPoints: number,
) => achievedPoints > 0 && achievedPoints < totalPoints;

export const isIncorrect = (achievedPoints: number) => achievedPoints === 0;

export function gradedStateFromPoints(
  achievedPoints: number,
  maxPoints: number,
): "correct" | "partial" | "incorrect" {
  if (maxPoints > 0 && isCorrect(achievedPoints, maxPoints)) return "correct";
  if (isPartiallyCorrect(achievedPoints, maxPoints)) return "partial";
  return "incorrect";
}

export const getQuestionBlockGradedState = (
  editable: EditableState,
  isEditorEditable: boolean,
  achievedPoints: number | undefined,
  maxPoints: number | undefined,
  block?: AnyInternalQuestionBlock,
): QuestionBlockGradedState | null => {
  if (editable === EditableState.NotEditable) {
    return null;
  }

  const points = getPointsObject(achievedPoints, maxPoints);
  if (hasGradedPoints(points)) {
    return gradedStateFromPoints(points.achievedPoints, points.maxPoints);
  }

  if (unanswered(isEditorEditable, block)) {
    return "unanswered";
  }

  return null;
};

export const isQuestionBlockReadOnlyWhenGraded = (
  achievedPoints: number | undefined,
  maxPoints: number | undefined,
) => hasGradedPoints(getPointsObject(achievedPoints, maxPoints));
