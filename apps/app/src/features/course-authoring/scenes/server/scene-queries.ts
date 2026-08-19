import { AppError } from "@scibly/api/application-error";
import { db, toMemberRole } from "@scibly/db";

import { sceneLineageService } from "@/features/course-authoring/scenes/server/scene-lineage";
import { requireOrgMember } from "@/features/organizations/server";

import { requireCourseEnrollment } from "../../access/server/policy";
import { requireSceneContentAccess } from "./scene-access";
import { mapAuthoringScene } from "./scene-mapping";

export async function listLessonScenes(
  userId: string,
  input: { lessonId: string; courseVersionId?: string },
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
  if (input.courseVersionId) {
    const membership = await requireOrgMember(
      lesson.course.organizationId,
      userId,
      "member",
    );
    await requireCourseEnrollment(
      lesson.courseId,
      userId,
      toMemberRole(membership.role),
    );
  } else {
    await requireOrgMember(
      lesson.course.organizationId,
      userId,
      "admin_or_owner",
    );
  }
  const scenes = await db.scene.findMany({
    where: {
      lessonId: input.lessonId,
      courseVersionId: input.courseVersionId ?? null,
    },
    orderBy: { order: "asc" },
    include: {
      sourceLineages: {
        select: {
          source: { select: { id: true, name: true, type: true } },
        },
      },
    },
  });
  return scenes.map(mapAuthoringScene);
}

export async function getDeletionNavigationContext(
  userId: string,
  sceneIdsInput: readonly string[],
) {
  const sceneIds = [...new Set(sceneIdsInput)];
  const scenes = await db.scene.findMany({
    where: { id: { in: sceneIds } },
    select: {
      id: true,
      lesson: {
        select: {
          id: true,
          title: true,
          course: {
            select: { id: true, title: true, organizationId: true },
          },
        },
      },
    },
  });
  if (scenes.length === 0) return null;

  for (const organizationId of new Set(
    scenes.map((scene) => scene.lesson.course.organizationId),
  )) {
    await requireOrgMember(organizationId, userId, "admin_or_owner");
  }

  const firstScene = scenes[0]!;
  const lessonIds = new Set(scenes.map((scene) => scene.lesson.id));
  return {
    courseId: firstScene.lesson.course.id,
    courseTitle: firstScene.lesson.course.title,
    focusLesson:
      lessonIds.size === 1
        ? {
            id: firstScene.lesson.id,
            title: firstScene.lesson.title,
          }
        : undefined,
  };
}

export async function getSceneLocation(userId: string, sceneId: string) {
  const scene = await requireSceneContentAccess(sceneId, userId);
  return {
    scene: { id: scene.id, title: scene.title },
    lesson: { id: scene.lesson.id, title: scene.lesson.title },
    course: { id: scene.lesson.course.id, title: scene.lesson.course.title },
  };
}

export async function getSceneContent(userId: string, sceneId: string) {
  const scene = await requireSceneContentAccess(sceneId, userId);
  const sourceIds = await sceneLineageService.getLineageForScene(sceneId);
  const state = scene.documentState;
  if (!state || state.length === 0) return { sceneId, html: "", sourceIds };
  return {
    sceneId,
    html:
      state[0] === 0x3c
        ? new TextDecoder().decode(state)
        : "[Binary Yjs state — the editor content is not readable through this API]",
    sourceIds,
  };
}

export async function getSceneLineage(userId: string, sceneId: string) {
  await requireSceneContentAccess(sceneId, userId);
  return {
    sourceIds: await sceneLineageService.getLineageForScene(sceneId),
  };
}
