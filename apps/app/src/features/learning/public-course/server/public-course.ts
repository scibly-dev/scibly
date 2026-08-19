import type { JSONContent } from "@tiptap/core";

import { AppError } from "@scibly/api/application-error";
import { resolveSubscribedPlan } from "@scibly/api/entitlement";
import { db } from "@scibly/db";

import "server-only";

import {
  createLearnerLessonSelect,
  mapLearnerLessons,
} from "../../course-player/server/learner-course";
import {
  injectPitchScenes,
  needsPitchScenes,
  type PublicLessonManifest,
} from "./pitch-placement";

export async function requireAnonymousCourse(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      organizationId: true,
      allowAnonymous: true,
      passingScorePct: true,
      maxTries: true,
      title: true,
      mode: true,
      thumbnail: true,
      organization: { select: { name: true } },
    },
  });
  if (!course) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Course not found.",
    });
  }
  if (!course.allowAnonymous) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "api.forbidden",
      message: "This course is not publicly accessible.",
    });
  }
  return course;
}

export async function getLatestCourseVersion(courseId: string) {
  const version = await db.courseVersion.findFirst({
    where: { courseId, superseded: false },
    orderBy: { version: "desc" },
    select: { id: true, version: true },
  });
  if (!version) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "course.not_published",
      message: "Course has not been published.",
    });
  }
  return version;
}

async function requirePublishedCourseVersion(
  courseId: string,
  courseVersionId: string,
) {
  const version = await db.courseVersion.findFirst({
    where: { id: courseVersionId, courseId, superseded: false },
    select: { id: true, version: true },
  });
  if (!version) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Course version not found.",
    });
  }
  return version;
}

export async function getPublicCourse(courseId: string) {
  const [course, latestVersion] = await Promise.all([
    requireAnonymousCourse(courseId),
    getLatestCourseVersion(courseId),
  ]);
  const [lessons, resolvedPlan] = await Promise.all([
    db.lesson.findMany({
      where: { courseVersionId: latestVersion.id },
      orderBy: { order: "asc" },
      select: createLearnerLessonSelect(latestVersion.id),
    }),
    resolveSubscribedPlan(db, course.organizationId).catch(() => null),
  ]);
  const learnerLessons = mapLearnerLessons(lessons);
  const lessonManifests: PublicLessonManifest[] = needsPitchScenes(resolvedPlan)
    ? injectPitchScenes(learnerLessons)
    : learnerLessons;
  return {
    id: course.id,
    title: course.title,
    mode: course.mode,
    thumbnail: course.thumbnail,
    organization: course.organization,
    passingScorePct: course.passingScorePct,
    maxTries: course.maxTries,
    lessons: lessonManifests,
    maxSp: lessonManifests.reduce((total, lesson) => total + lesson.maxSp, 0),
    courseVersionId: latestVersion.id,
    version: latestVersion.version,
  };
}

export async function getPublicSceneContent(
  courseId: string,
  courseVersionId: string,
  sceneId: string,
) {
  await requireAnonymousCourse(courseId);
  await requirePublishedCourseVersion(courseId, courseVersionId);
  const scene = await db.scene.findFirst({
    where: {
      id: sceneId,
      courseVersionId,
      lesson: { courseId, courseVersionId },
    },
    select: { id: true, learnerContent: true },
  });
  if (!scene?.learnerContent) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Scene content not found.",
    });
  }
  // SAFETY: this is the JSON column the publish step wrote from a TipTap

  return {
    sceneId: scene.id,
    learnerContent: scene.learnerContent as JSONContent,
  };
}
