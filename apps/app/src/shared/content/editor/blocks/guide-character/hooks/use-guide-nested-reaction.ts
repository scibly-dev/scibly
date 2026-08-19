"use client";

import type { Node as PMNode } from "@tiptap/pm/model";
import type { QuestionBlockMap } from "@/shared/content/editor/assessment/parsing/base-parser/types";
import type { GuideFeedbackStatus } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";

import { useMemo } from "react";

import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";
import {
  hasGradedPoints,
  isCorrect,
  isIncorrect,
  isPartiallyCorrect,
} from "@/shared/content/editor/assessment/grading/question-block-store/helpers";

type GradedOutcome = "correct" | "incorrect" | "other" | "partial" | "ungraded";

function collectNestedQuestionBlockIds(node: PMNode): string[] {
  const ids: string[] = [];
  node.descendants((child) => {
    if (
      child.attrs.questionBlockAttributes &&
      typeof child.attrs.id === "string" &&
      child.attrs.id.length > 0
    ) {
      ids.push(child.attrs.id);
    }
  });
  return ids;
}

function getGradedOutcome(
  blockId: string,
  questionBlocks: QuestionBlockMap,
): GradedOutcome {
  const block = questionBlocks.get(blockId);
  if (!block) return "ungraded";

  const points = {
    achievedPoints: block.achievedPoints,
    maxPoints: block.maxPoints,
  };
  if (!hasGradedPoints(points)) return "ungraded";

  if (points.maxPoints <= 0) return "ungraded";
  if (isIncorrect(points.achievedPoints)) return "incorrect";
  if (isCorrect(points.achievedPoints, points.maxPoints)) return "correct";
  if (isPartiallyCorrect(points.achievedPoints, points.maxPoints)) {
    return "partial";
  }
  return "other";
}

function resolveReaction(
  outcomes: GradedOutcome[],
): GuideFeedbackStatus | null {
  const graded = outcomes.filter((outcome) => outcome !== "ungraded");
  if (graded.length === 0) return null;
  if (
    graded.every((outcome) => outcome !== "incorrect" && outcome !== "partial")
  ) {
    return "perfect";
  }
  if (
    graded.every((outcome) => outcome !== "correct" && outcome !== "partial")
  ) {
    return "incorrect";
  }
  return "partial";
}

export function deriveReactionFromGradedBlocks(
  blockIds: string[],
  questionBlocks: QuestionBlockMap,
): GuideFeedbackStatus | null {
  if (blockIds.length === 0) return null;

  return resolveReaction(
    blockIds.map((blockId) => getGradedOutcome(blockId, questionBlocks)),
  );
}

export function useGuideNestedReaction(
  node: PMNode,
): GuideFeedbackStatus | null {
  const blockIds = useMemo(() => collectNestedQuestionBlockIds(node), [node]);
  const questionBlocks = useQuestionBlockStore((state) => state.questionBlocks);

  return useMemo(
    () => deriveReactionFromGradedBlocks(blockIds, questionBlocks),
    [blockIds, questionBlocks],
  );
}
