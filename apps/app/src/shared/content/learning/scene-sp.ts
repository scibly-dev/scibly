import type { JSONContent } from "@tiptap/core";

import { z } from "zod";

export const DEFAULT_SCENE_SP = 0;

export function getEffectiveSceneSp(sp: number | null | undefined): number {
  if (sp === null || sp === undefined) return DEFAULT_SCENE_SP;
  return sp;
}

export function getCanvasSceneAvailableSp(
  sceneSp: number | null | undefined,
  questionSp: number,
) {
  return getEffectiveSceneSp(sceneSp) + questionSp;
}

function isQuestionBlockFlag(value: unknown): boolean {
  return value === true || value === "true";
}

type DraftSceneMaxSpInput = {
  sp: number | null | undefined;
  learnerContent?: JSONContent | null;
};

type PublishedSceneMaxSpRecord = {
  maxSp: number | null | undefined;
};

export function hasQuestionBlocks(
  learnerContent: JSONContent | null | undefined,
): boolean {
  if (!learnerContent) return false;
  if (isQuestionBlockFlag(learnerContent.attrs?.isQuestionBlock)) return true;
  return learnerContent.content?.some(hasQuestionBlocks) ?? false;
}

const questionBlockSp = z.object({ sp: z.number() });

function sumQuestionBlockSp(
  learnerContent: JSONContent | null | undefined,
): number {
  if (!learnerContent) return 0;
  let total = 0;
  const visit = (node: JSONContent) => {
    const attributes = questionBlockSp.safeParse(
      node.attrs?.questionBlockAttributes,
    );
    if (
      isQuestionBlockFlag(node.attrs?.isQuestionBlock) &&
      attributes.success
    ) {
      total += attributes.data.sp;
    }
    node.content?.forEach(visit);
  };
  visit(learnerContent);
  return total;
}

export function computeDraftSceneMaxSp(scene: DraftSceneMaxSpInput): number {
  return getCanvasSceneAvailableSp(
    scene.sp,
    sumQuestionBlockSp(scene.learnerContent),
  );
}

export function requirePublishedSceneMaxSp(
  maxSp: number | null | undefined,
  context?: string,
): number {
  if (maxSp == null) {
    throw new Error(
      context
        ? `Published scene is missing maxSp (${context}).`
        : "Published scene is missing maxSp.",
    );
  }
  return maxSp;
}

export function sumPublishedScenesMaxSp(
  scenes: PublishedSceneMaxSpRecord[],
): number {
  return scenes.reduce(
    (total, scene) => total + requirePublishedSceneMaxSp(scene.maxSp),
    0,
  );
}
