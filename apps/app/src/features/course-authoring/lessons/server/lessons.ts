import type { LessonIcon } from "@scibly/db/enums";

import { AppError } from "@scibly/api/application-error";
import { db, Prisma } from "@scibly/db";

import "server-only";
import {
  type LessonDesign,
  MODERN_MINIMAL_DESIGN,
} from "@/shared/content/course/course-validation";
import { getDefaultLessonIconForOrder } from "@/shared/content/course/lesson-icons";

import {
  requireCourseAccess,
  requireCourseAdmin,
} from "../../access/server/policy";
import {
  getNextDraftLessonOrder,
  rewriteDraftLessonOrder,
} from "../../ordering/server/ordering";
import { ensureDefaultIntroductionScene } from "./ensure-default-introduction-scene";

async function requireAccessToCourseId(userId: string, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, organizationId: true },
  });
  if (!course) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Course not found.",
    });
  }
  await requireCourseAccess(userId, course);
}

export async function getCourseLesson(
  userId: string,
  input: { courseId: string; lessonId: string },
) {
  await requireAccessToCourseId(userId, input.courseId);
  const lesson = await db.lesson.findUnique({ where: { id: input.lessonId } });
  if (!lesson || lesson.courseId !== input.courseId) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Lesson not found.",
    });
  }
  return lesson;
}

export async function listCourseLessons(
  userId: string,
  input: { courseId: string; limit: number; cursor?: number | null },
) {
  await requireAccessToCourseId(userId, input.courseId);
  const offset = input.cursor ?? 0;
  const [totalCount, lessons] = await Promise.all([
    db.lesson.count({
      where: { courseId: input.courseId, courseVersionId: null },
    }),
    db.lesson.findMany({
      where: { courseId: input.courseId, courseVersionId: null },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      take: input.limit + 1,
      skip: offset,
    }),
  ]);
  return {
    items: lessons.slice(0, input.limit),
    nextCursor: lessons.length > input.limit ? offset + input.limit : undefined,
    totalCount,
  };
}

export async function listCourseScenes(userId: string, courseId: string) {
  await requireAccessToCourseId(userId, courseId);
  const lessons = await db.lesson.findMany({
    where: { courseId, courseVersionId: null },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, title: true },
  });
  if (lessons.length === 0) return [];

  const scenes = await db.scene.findMany({
    where: {
      lessonId: { in: lessons.map((lesson) => lesson.id) },
      courseVersionId: null,
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, title: true, lessonId: true },
  });
  const lessonTitleById = new Map(
    lessons.map((lesson) => [lesson.id, lesson.title]),
  );
  return scenes.map((scene) => ({
    lessonId: scene.lessonId,
    lessonTitle: lessonTitleById.get(scene.lessonId) ?? "Lesson",
    sceneId: scene.id,
    sceneTitle: scene.title,
  }));
}

export async function createDraftLesson(
  userId: string,
  input: {
    courseId: string;
    title: string;
    description?: string;
    icon?: LessonIcon;
    estimatedTimeToCompleteMinutes?: number | null;
  },
) {
  const course = await requireCourseAdmin(input.courseId, userId, {
    select: { id: true, organizationId: true, mode: true },
  });

  return db.$transaction(async (tx) => {
    if (course.mode === "LESSON") {
      const draftLessons = await tx.lesson.count({
        where: { courseId: input.courseId, courseVersionId: null },
      });
      if (draftLessons > 0) {
        throw new AppError({
          code: "CONFLICT",
          applicationCode: "course.lesson_mode_is_full",
          message:
            "A lesson holds one lesson. Switch the course to course mode to add more.",
        });
      }
    }
    const order = await getNextDraftLessonOrder(tx, input.courseId);
    const lesson = await tx.lesson.create({
      data: {
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        icon: input.icon ?? getDefaultLessonIconForOrder(order),
        estimatedTimeToCompleteMinutes:
          input.estimatedTimeToCompleteMinutes || 0,
        design: MODERN_MINIMAL_DESIGN,
        order,
      },
    });
    await ensureDefaultIntroductionScene(tx, lesson.id);
    return lesson;
  });
}

export async function updateDraftLesson(
  userId: string,
  input: {
    courseId: string;
    lessonId: string;
    title?: string;
    description?: string;
    icon?: LessonIcon;
    estimatedTimeToCompleteMinutes?: number;
    design?: LessonDesign | null;
  },
) {
  await requireCourseAdmin(input.courseId, userId);
  const lesson = await db.lesson.findUnique({
    where: { id: input.lessonId },
    select: { courseId: true, courseVersionId: true },
  });

  if (!lesson || lesson.courseId !== input.courseId) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Lesson not found.",
    });
  }
  if (lesson.courseVersionId != null) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "api.forbidden",
      message: "Published lesson versions cannot be edited.",
    });
  }

  return db.lesson.update({
    where: { id: input.lessonId },
    data: {
      title: input.title,
      description: input.description,
      icon: input.icon,
      estimatedTimeToCompleteMinutes: input.estimatedTimeToCompleteMinutes,

      design:
        input.design === undefined
          ? undefined
          : (input.design ?? Prisma.DbNull),
    },
  });
}

export async function reorderDraftLessons(
  userId: string,
  input: { courseId: string; lessonIds: string[] },
) {
  await requireCourseAdmin(input.courseId, userId);
  await db.$transaction((tx) =>
    rewriteDraftLessonOrder(tx, input.courseId, input.lessonIds),
  );
  return { success: true };
}

export async function deleteDraftLessons(
  userId: string,
  input: { courseId: string; lessonIds: string[] },
) {
  await requireCourseAdmin(input.courseId, userId);
  const lessonIds = [...new Set(input.lessonIds)];
  const lessons = await db.lesson.findMany({
    where: { id: { in: lessonIds }, courseId: input.courseId },
    select: { id: true, courseVersionId: true },
  });
  const foundIds = new Set(lessons.map((lesson) => lesson.id));
  const missingLessonIds = lessonIds.filter((id) => !foundIds.has(id));

  if (missingLessonIds.length > 0) {
    return {
      success: false as const,
      deletedLessonIds: [] as const,
      missingLessonIds,
      courseId: input.courseId,
      message:
        "Deletion aborted — none of the lessons were removed. " +
        `Lesson IDs not found in this course: ${missingLessonIds.join(", ")}. ` +
        "Verify lesson IDs for this course, then retry deleteLessons with corrected IDs.",
    };
  }

  const publishedLessonIds = lessons
    .filter((lesson) => lesson.courseVersionId != null)
    .map((lesson) => lesson.id);
  if (publishedLessonIds.length > 0) {
    return {
      success: false as const,
      deletedLessonIds: [] as const,
      missingLessonIds: [] as const,
      publishedLessonIds,
      courseId: input.courseId,
      message: "Cannot delete a published lesson.",
    };
  }

  const idsToDelete = lessons.map((lesson) => lesson.id);
  await db.lesson.deleteMany({
    where: {
      id: { in: idsToDelete },
      courseId: input.courseId,
      courseVersionId: null,
    },
  });
  const stillPresentIds = new Set(
    (
      await db.lesson.findMany({
        where: { id: { in: idsToDelete } },
        select: { id: true },
      })
    ).map((lesson) => lesson.id),
  );
  const deletedLessonIds = idsToDelete.filter((id) => !stillPresentIds.has(id));
  await db.course.update({
    where: { id: input.courseId },
    data: {},
  });
  return {
    success: true as const,
    deletedLessonIds,
    courseId: input.courseId,
  };
}
