import type { BlockSubmission } from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import "server-only";
import { requireOrgMember } from "@/features/organizations/server";
import { gradeSceneBlocks } from "@/shared/content/editor/server";
import { getEffectiveSceneSp } from "@/shared/content/learning/scene-sp";
import {
  gradePracticeSubmission,
  type PracticeGradingManifest,
} from "@/shared/content/practice/grade-practice-submission";

export async function previewScene(
  userId: string,
  input: {
    lessonId: string;
    sceneId: string;
    blocks?: BlockSubmission[];
    practiceWork?: unknown;
  },
) {
  const lesson = await db.lesson.findUnique({
    where: { id: input.lessonId },
    select: { course: { select: { organizationId: true } } },
  });
  if (!lesson) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Lesson not found.",
    });
  }
  await requireOrgMember(
    lesson.course.organizationId,
    userId,
    "admin_or_owner",
  );
  const scene = await db.scene.findFirst({
    where: {
      id: input.sceneId,
      lessonId: input.lessonId,
      courseVersionId: null,
    },
    select: {
      documentState: true,
      sp: true,
      kind: true,
      practiceSolution: true,
      practiceExplain: true,
    },
  });
  if (!scene) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Scene not found.",
    });
  }
  if (scene.kind === "PRACTICE") {
    const manifest: PracticeGradingManifest = {
      // SAFETY: only ever written by writePractice via `practiceSolutionSchema`.
      solution: scene.practiceSolution as PracticeGradingManifest["solution"],
      explain: scene.practiceExplain,
    };
    const result = gradePracticeSubmission(
      input.practiceWork,
      manifest,
      getEffectiveSceneSp(scene.sp),
    );
    return {
      success: true,
      gradedBlocks: result.gradedFields,
      spEarned: result.totalSpEarned,
      explanation: result.explanation,
    };
  }
  const result = gradeSceneBlocks(
    input.blocks,
    scene.documentState,
    getEffectiveSceneSp(scene.sp),
  );
  return {
    success: true,
    gradedBlocks: result.gradedBlocks,
    spEarned: result.totalSpEarned,
  };
}
