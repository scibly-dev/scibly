import type {
  GapSegment,
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";

import { findFirstEmptyGapId } from "@/shared/content/editor/blocks/questions/cloze-text/schema";

export function assignWordToNextGap(
  questionData: QuestionData,
  userAnswers: UserAnswer,
  itemId: string,
): UserAnswer | null {
  const gaps = questionData.segments.filter(
    (segment): segment is GapSegment => segment.type === "gap",
  );
  const targetGapId = findFirstEmptyGapId(gaps, userAnswers);
  if (!targetGapId) {
    return null;
  }

  return {
    ...userAnswers,
    [targetGapId]: itemId,
  };
}

export function removeWordFromGap(
  userAnswers: UserAnswer,
  gapId: string,
): UserAnswer {
  const next = { ...userAnswers };
  delete next[gapId];
  return next;
}
