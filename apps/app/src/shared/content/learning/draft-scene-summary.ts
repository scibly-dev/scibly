import type { JSONContent } from "@tiptap/core";

import { computeDraftSceneMaxSp, hasQuestionBlocks } from "./scene-sp";

export function summarizeDraftScene(
  sp: number | null,
  learnerContent: JSONContent | null,
) {
  const hasQuestions = hasQuestionBlocks(learnerContent);
  return {
    kind: hasQuestions ? ("assessment" as const) : ("content" as const),
    maxSp: computeDraftSceneMaxSp({
      sp,
      learnerContent,
    }),
  };
}
