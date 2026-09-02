import type { SceneIntegration } from "@/shared/content/course/scene-validation";

import { AppError } from "@scibly/api/application-error";
import { db, Prisma } from "@scibly/db";
import { type SceneAnimation, type SceneVibe } from "@scibly/db/enums";

import { sceneLineageService } from "@/features/course-authoring/scenes/server/scene-lineage";

import { linkNotebook } from "../../courses/server/courses";
import {
  type SceneUser,
  type SceneWriteMode,
  writeSceneHtml,
} from "../editor/document-synchronization/server/scene-document";
import { requireDraftSceneContentAccess } from "./scene-access";
import { mapAuthoringScene } from "./scene-mapping";

export async function updateDraftScene(
  user: SceneUser,
  input: {
    sceneId: string;
    updates?: {
      title?: string;
      vibe?: SceneVibe;
      animation?: SceneAnimation;
      sp?: number;
      integration?: SceneIntegration | null;
    };
  },
) {
  const scene = await requireDraftSceneContentAccess(input.sceneId, user.id);
  const { integration, ...scalarUpdates } = input.updates ?? {};
  const updated = await db.scene.update({
    where: { id: input.sceneId },
    data: {
      ...scalarUpdates,

      integration: integration === null ? Prisma.DbNull : integration,
    },
  });
  return { ...mapAuthoringScene(updated), courseId: scene.lesson.courseId };
}

export async function writeSceneContent(
  user: SceneUser,
  input: { sceneId: string; html: string; mode?: SceneWriteMode },
) {
  await requireDraftSceneContentAccess(input.sceneId, user.id);
  await applySceneHtml(
    user,
    input.sceneId,
    input.html,
    input.mode ?? "replace",
  );
  return { sceneId: input.sceneId, success: true as const };
}

async function applySceneHtml(
  user: SceneUser,
  sceneId: string,
  html: string,
  mode: SceneWriteMode,
) {
  const result = await writeSceneHtml({ sceneId, html, mode, user });
  if (result.success) return;

  // Content the editor would not accept is the caller's to fix; a write that never reached the room is ours.
  throw result.refused
    ? new AppError({
        code: "BAD_REQUEST",
        applicationCode: "api.bad_request",
        message: result.error,
      })
    : new AppError({
        code: "INTERNAL_SERVER_ERROR",
        applicationCode: "api.internal_error",
        message: result.error,
      });
}

export async function setDraftSceneLineage(
  userId: string,
  input: { sceneId: string; sourceIds: string[]; notebookId?: string },
) {
  const scene = await requireDraftSceneContentAccess(input.sceneId, userId);
  if (input.notebookId) {
    await linkNotebook(userId, {
      courseId: scene.lesson.courseId,
      notebookId: input.notebookId,
    });
  }
  await sceneLineageService.finalizeSceneEdit(input.sceneId, input.sourceIds);
  return {
    sceneId: input.sceneId,
    lessonId: scene.lessonId,
    courseId: scene.lesson.courseId,
    success: true as const,
  };
}
