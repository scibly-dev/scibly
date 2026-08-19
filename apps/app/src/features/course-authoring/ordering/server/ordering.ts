import type { Prisma } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";

import "server-only";

type OrderedDraft = "lesson" | "scene";

function invalidOrderMessage(resource: OrderedDraft): string {
  return resource === "lesson"
    ? "Lesson order must include every draft lesson exactly once."
    : "Scene order must include every draft scene exactly once.";
}

export async function getNextDraftLessonOrder(
  tx: Prisma.TransactionClient,
  courseId: string,
): Promise<number> {
  const lastLesson = await tx.lesson.findFirst({
    where: { courseId, courseVersionId: null },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (lastLesson?.order ?? -1) + 1;
}

export async function getNextDraftSceneOrder(
  tx: Prisma.TransactionClient,
  lessonId: string,
): Promise<number> {
  const lastScene = await tx.scene.findFirst({
    where: { lessonId, courseVersionId: null },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (lastScene?.order ?? -1) + 1;
}

export async function rewriteDraftLessonOrder(
  tx: Prisma.TransactionClient,
  courseId: string,
  lessonIds: readonly string[],
): Promise<void> {
  const uniqueIds = [...new Set(lessonIds)];
  const [draftCount, ownedCount] = await Promise.all([
    tx.lesson.count({ where: { courseId, courseVersionId: null } }),
    tx.lesson.count({
      where: {
        id: { in: uniqueIds },
        courseId,
        courseVersionId: null,
      },
    }),
  ]);
  if (
    uniqueIds.length !== lessonIds.length ||
    draftCount !== lessonIds.length ||
    ownedCount !== lessonIds.length
  ) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: invalidOrderMessage("lesson"),
    });
  }

  await Promise.all(
    lessonIds.map((id, order) =>
      tx.lesson.update({ where: { id }, data: { order } }),
    ),
  );
}

export async function rewriteDraftSceneOrder(
  tx: Prisma.TransactionClient,
  lessonId: string,
  sceneIds: readonly string[],
): Promise<void> {
  const uniqueIds = [...new Set(sceneIds)];
  const [draftCount, ownedCount] = await Promise.all([
    tx.scene.count({ where: { lessonId, courseVersionId: null } }),
    tx.scene.count({
      where: {
        id: { in: uniqueIds },
        lessonId,
        courseVersionId: null,
      },
    }),
  ]);
  if (
    uniqueIds.length !== sceneIds.length ||
    draftCount !== sceneIds.length ||
    ownedCount !== sceneIds.length
  ) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: invalidOrderMessage("scene"),
    });
  }

  await Promise.all(
    sceneIds.map((id, order) =>
      tx.scene.update({ where: { id }, data: { order } }),
    ),
  );
}
