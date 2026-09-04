import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";
import { isRawHtmlState } from "@scibly/lib/collab-yjs";

import { sceneLineageService } from "@/features/course-authoring/scenes/server/scene-lineage";
import { requireOrgMember } from "@/features/organizations/server";
import { normalizeAuthorTipTapContent } from "@/shared/content/editor/server";

import {
  readSceneHtml,
  type SceneUser,
} from "../editor/document-synchronization/server/scene-document";
import {
  sceneHtml,
  sceneSchema,
} from "../editor/document-synchronization/server/scene-html";
import { requireSceneContentAccess } from "./scene-access";
import { authoringSceneSelect, mapAuthoringScene } from "./scene-mapping";

export async function listLessonScenes(
  userId: string,
  input: { lessonId: string },
) {
  const lesson = await db.lesson.findUnique({
    where: { id: input.lessonId },
    include: { course: true },
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
  const scenes = await db.scene.findMany({
    where: {
      lessonId: input.lessonId,
      courseVersionId: null,
    },
    orderBy: { order: "asc" },
    select: {
      ...authoringSceneSelect,
      sourceLineages: {
        select: {
          source: { select: { id: true, name: true, type: true } },
        },
      },
    },
  });
  return scenes.map(mapAuthoringScene);
}

export async function getSceneLocation(userId: string, sceneId: string) {
  const scene = await requireSceneContentAccess(sceneId, userId);
  return {
    scene: { id: scene.id, title: scene.title },
    lesson: { id: scene.lesson.id, title: scene.lesson.title },
    course: { id: scene.lesson.course.id, title: scene.lesson.course.title },
  };
}

export async function getSceneContent(user: SceneUser, sceneId: string) {
  const scene = await requireSceneContentAccess(sceneId, user.id);
  if (scene.kind === "PRACTICE") {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message:
        "This is a PRACTICE scene — use getPractice instead of getSceneContent.",
    });
  }
  const sourceIds = await sceneLineageService.getLineageForScene(sceneId);

  if (scene.courseVersionId == null) {
    const result = await readSceneHtml({ sceneId, user });
    if (!result.success) {
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        applicationCode: "api.internal_error",
        message: result.error,
      });
    }
    return { sceneId, html: result.html, sourceIds };
  }

  const published = await db.scene.findUnique({
    where: { id: sceneId },
    select: { documentState: true },
  });
  return {
    sceneId,
    html: frozenSceneHtml(published?.documentState ?? null),
    sourceIds,
  };
}

/** Scenes last saved before collaborative editing are still parked as raw HTML. */
function frozenSceneHtml(documentState: Uint8Array | null): string {
  if (!documentState || documentState.length === 0) return "";
  if (isRawHtmlState(documentState)) {
    return new TextDecoder().decode(documentState);
  }
  return sceneHtml(
    sceneSchema().nodeFromJSON(normalizeAuthorTipTapContent(documentState)),
  );
}

export async function getSceneLineage(userId: string, sceneId: string) {
  await requireSceneContentAccess(sceneId, userId);
  return {
    sourceIds: await sceneLineageService.getLineageForScene(sceneId),
  };
}
