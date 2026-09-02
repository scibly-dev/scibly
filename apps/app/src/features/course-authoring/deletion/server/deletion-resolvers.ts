import { db } from "@scibly/db";

import "server-only";
import { requireOrgMember } from "@/features/organizations/server";

// The course is derived, never filtered on, so nothing is ever listed under a course title it does not belong to.

/** `null` means nothing resolved, so nothing was authorized against either — an id matching no row reveals nothing. */
export async function resolveSceneDeletion(
  userId: string,
  sceneIdsInput: readonly string[],
) {
  const sceneIds = [...new Set(sceneIdsInput)];
  const scenes = await db.scene.findMany({
    where: {
      id: { in: sceneIds },
      courseVersionId: null,
      lesson: { courseVersionId: null },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      lesson: {
        select: {
          id: true,
          title: true,
          course: { select: { id: true, title: true, organizationId: true } },
        },
      },
    },
  });
  if (scenes.length === 0) return null;

  const { id, title, organizationId } = scenes[0]!.lesson.course;
  await requireOrgMember(organizationId, userId, "admin_or_owner");

  const inCourse = scenes.filter((scene) => scene.lesson.course.id === id);
  const foundIds = new Set(inCourse.map((scene) => scene.id));
  return {
    course: { id, title },
    found: inCourse.map((scene) => ({
      sceneId: scene.id,
      sceneTitle: scene.title,
      lessonId: scene.lesson.id,
      lessonTitle: scene.lesson.title,
    })),
    missing: sceneIds.filter((sceneId) => !foundIds.has(sceneId)),
  };
}

export async function resolveLessonDeletion(
  userId: string,
  lessonIdsInput: readonly string[],
) {
  const lessonIds = [...new Set(lessonIdsInput)];
  const lessons = await db.lesson.findMany({
    where: { id: { in: lessonIds }, courseVersionId: null },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      course: { select: { id: true, title: true, organizationId: true } },
      _count: { select: { scenes: { where: { courseVersionId: null } } } },
    },
  });
  if (lessons.length === 0) return null;

  const { id, title, organizationId } = lessons[0]!.course;
  await requireOrgMember(organizationId, userId, "admin_or_owner");

  const inCourse = lessons.filter((lesson) => lesson.course.id === id);
  const foundIds = new Set(inCourse.map((lesson) => lesson.id));
  return {
    course: { id, title },
    found: inCourse.map((lesson) => ({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      sceneCount: lesson._count.scenes,
    })),
    missing: lessonIds.filter((lessonId) => !foundIds.has(lessonId)),
  };
}
