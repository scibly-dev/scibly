import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import "server-only";
import { getAuthorPreviewContent } from "@/shared/content/editor/server";
import { summarizeDraftScene } from "@/shared/content/learning/draft-scene-summary";

import { requireCourseAdmin } from "../../access/server/policy";

export async function getCoursePreview(userId: string, courseId: string) {
  await requireCourseAdmin(courseId, userId);
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      mode: true,
      thumbnail: true,
      passingScorePct: true,
      maxTries: true,
      lessons: {
        where: { courseVersionId: null },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          estimatedTimeToCompleteMinutes: true,
          design: true,
          scenes: {
            where: { courseVersionId: null },
            orderBy: { order: "asc" },
            select: {
              id: true,
              animation: true,
              sp: true,
              documentState: true,
            },
          },
        },
      },
    },
  });
  if (!course) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Course not found.",
    });
  }
  const lessons = course.lessons.map((lesson) => {
    let maxSp = 0;
    const scenes = lesson.scenes.map((scene) => {
      const content = getAuthorPreviewContent(scene.documentState);
      const structuredContent = typeof content === "object" ? content : null;
      const summary = summarizeDraftScene(scene.sp, structuredContent);
      maxSp += summary.maxSp;
      return {
        id: scene.id,
        animation: scene.animation,

        design: lesson.design,
        kind: summary.kind,
      };
    });
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      icon: lesson.icon,
      estimatedTimeToCompleteMinutes: lesson.estimatedTimeToCompleteMinutes,
      scenes,
      maxSp,
    };
  });
  return {
    id: course.id,
    title: course.title,
    mode: course.mode,
    thumbnail: course.thumbnail,
    passingScorePct: course.passingScorePct,
    maxTries: course.maxTries,
    lessons,
    maxSp: lessons.reduce((total, lesson) => total + lesson.maxSp, 0),
  };
}

export async function getPreviewSceneContent(
  userId: string,
  courseId: string,
  sceneId: string,
) {
  await requireCourseAdmin(courseId, userId);
  const scene = await db.scene.findFirst({
    where: {
      id: sceneId,
      courseVersionId: null,
      lesson: { courseId, courseVersionId: null },
    },
    select: { id: true, documentState: true },
  });
  if (!scene) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Scene content not found.",
    });
  }
  return {
    sceneId: scene.id,
    learnerContent: getAuthorPreviewContent(scene.documentState),
  };
}
