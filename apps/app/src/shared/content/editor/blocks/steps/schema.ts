import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

import { z } from "zod";

export const STEPS_NODE_NAME = "steps";
export const STEP_NODE_NAME = "step";

export type QuestionData = {
  stepCount: number;

  firstEmptyStep: number | null;
};

export type UserAnswer = number;

export const defaultQuestionData: QuestionData = {
  stepCount: 0,
  firstEmptyStep: null,
};

export const defaultAnswerData: UserAnswer = 0;

export const userAnswerStructureSchema = z.number().int().min(0);

export const questionDataStructureSchema = z.strictObject({
  stepCount: z.number().int().min(0),
  firstEmptyStep: z.number().int().min(1).nullable(),
});

/** The 1-based index of the first step with neither text nor media, or null
 * when every step is filled in. */
export function findEmptyStep(block: ProseMirrorNode): number | null {
  for (let index = 0; index < block.childCount; index += 1) {
    const step = block.child(index);
    if (step.textContent.trim()) continue;
    let hasMedia = false;
    step.descendants((child) => {
      if (child.isLeaf && !child.isText) hasMedia = true;
    });
    if (!hasMedia) return index + 1;
  }
  return null;
}
