import type { BlockSubmission } from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import "server-only";
import { requireOrgMember } from "@/features/organizations/server";
import { gradeSceneBlocks } from "@/shared/content/editor/server";
import { getEffectiveSceneSp } from "@/shared/content/learning/scene-sp";

export async function previewScene(
  userId: string,
  input: { lessonId: string; sceneId: string; blocks?: BlockSubmission[] },
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
    select: { documentState: true, sp: true },
  });
  if (!scene) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Scene not found.",
    });
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
