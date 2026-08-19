import type { SceneIntegration } from "@/shared/content/course/scene-validation";

import { db, Prisma } from "@scibly/db";
import { type SceneAnimation, type SceneVibe } from "@scibly/db/enums";
import { encodeHtmlBytes } from "@scibly/lib";

import { sceneLineageService } from "@/features/course-authoring/scenes/server/scene-lineage";

import { linkNotebook } from "../../courses/server/courses";
import { requireDraftSceneContentAccess } from "./scene-access";
import { mapAuthoringScene } from "./scene-mapping";

export async function updateDraftScene(
  userId: string,
  input: {
    sceneId: string;
    updates?: {
      title?: string;
      vibe?: SceneVibe;
      animation?: SceneAnimation;
      sp?: number;
      integration?: SceneIntegration | null;
    };
    html?: string;
  },
) {
  const scene = await requireDraftSceneContentAccess(input.sceneId, userId);
  const { integration, ...scalarUpdates } = input.updates ?? {};
  const updated = await db.scene.update({
    where: { id: input.sceneId },
    data: {
      ...scalarUpdates,

      integration: integration === null ? Prisma.DbNull : integration,
      documentState:
        input.html === undefined
          ? undefined
          : Buffer.from(encodeHtmlBytes(input.html)),
    },
  });
  return { ...mapAuthoringScene(updated), courseId: scene.lesson.courseId };
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
