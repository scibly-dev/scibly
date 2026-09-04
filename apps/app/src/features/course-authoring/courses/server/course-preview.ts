import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import "server-only";
import { getAuthorPreviewContent } from "@/shared/content/editor/server";
import { summarizeDraftScene } from "@/shared/content/learning/draft-scene-summary";
import { summarizePublishedPracticeManifest } from "@/shared/content/learning/published-scene-summary";
import { type PracticeGradingManifest } from "@/shared/content/practice/grade-practice-submission";

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
              kind: true,
              practiceSolution: true,
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
      // The `kind` returned below is how the player runs the scene, not the DB enum.
      let playMode: "assessment" | "content";
      let sceneMaxSp: number;
      if (scene.kind === "PRACTICE") {
        // SAFETY: `writePractice` validates this column against `practiceSolutionSchema`.
        const summary = summarizePublishedPracticeManifest(
          scene.sp,
          scene.practiceSolution as PracticeGradingManifest["solution"],
        );
        playMode = summary.hasQuestions ? "assessment" : "content";
        sceneMaxSp = summary.maxSp;
      } else {
        const content = getAuthorPreviewContent(scene.documentState);
        const summary = summarizeDraftScene(
          scene.sp,
          typeof content === "object" ? content : null,
        );
        playMode = summary.kind;
        sceneMaxSp = summary.maxSp;
      }
      maxSp += sceneMaxSp;
      return {
        id: scene.id,
        animation: scene.animation,
        design: lesson.design,
        kind: playMode,
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
    select: { id: true, documentState: true, kind: true, practiceHtml: true },
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
    ...(scene.kind === "PRACTICE"
      ? { kind: "PRACTICE" as const, learnerContent: scene.practiceHtml ?? "" }
      : {
          kind: "DOCUMENT" as const,
          learnerContent: getAuthorPreviewContent(scene.documentState),
        }),
  };
}
