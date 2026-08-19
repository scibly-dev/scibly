import type { PrismaClient } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { db, toMemberRole } from "@scibly/db";

import { requireOrgMember } from "@/features/organizations/server";

import { requireCourseEnrollment } from "../../access/server/policy";

export async function requireSceneContentAccess(
  sceneId: string,
  userId: string,
) {
  const scene = await db.scene.findUnique({
    where: { id: sceneId },
    include: { lesson: { include: { course: true } } },
  });
  if (!scene) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Scene not found.",
    });
  }
  if (scene.courseVersionId === null) {
    await requireOrgMember(
      scene.lesson.course.organizationId,
      userId,
      "admin_or_owner",
    );
  } else {
    const membership = await requireOrgMember(
      scene.lesson.course.organizationId,
      userId,
      "member",
    );
    await requireCourseEnrollment(
      scene.lesson.courseId,
      userId,
      toMemberRole(membership.role),
    );
  }
  return scene;
}

export async function requireDraftSceneContentAccess(
  sceneId: string,
  userId: string,
) {
  const scene = await requireSceneContentAccess(sceneId, userId);
  if (scene.courseVersionId != null) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "Cannot edit a published scene.",
    });
  }
  return scene;
}

export async function requireDraftLesson(
  client: PrismaClient,
  lessonId: string,
  userId: string,
) {
  const lesson = await client.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true },
  });
  if (!lesson) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Lesson not found.",
    });
  }
  if (lesson.courseVersionId != null) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "Cannot edit a published lesson.",
    });
  }
  await requireOrgMember(
    lesson.course.organizationId,
    userId,
    "admin_or_owner",
  );
  return lesson;
}
