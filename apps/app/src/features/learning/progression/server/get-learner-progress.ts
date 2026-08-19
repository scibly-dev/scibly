import type { EnrollmentStatus } from "@scibly/db/enums";
import type { PersistedGradedBlock } from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import "server-only";
import { parsePersistedGradedBlocks } from "@/shared/content/contracts";

import { requireAnonymousCourse } from "../../public-course/server/public-course";
import { evaluatePassState, getActiveAttempt } from "../progression-rules";

type ProgressAnalytics = {
  sceneId: string;
  spEarned: number;
  gradedBlocks: PersistedGradedBlock[];
};

function toLearnerAnalytics<
  T extends { sceneId: string; gradedBlocks: unknown; spEarned: number },
>(analytics: T[]): ProgressAnalytics[] {
  return analytics.map((entry) => ({
    sceneId: entry.sceneId,
    spEarned: entry.spEarned,
    gradedBlocks: parsePersistedGradedBlocks(entry.gradedBlocks),
  }));
}

type LearnerProgress = {
  completedLessonIds: string[];
  completedSceneIds: string[];
  totalSP: number;
  sceneAnalytics: ProgressAnalytics[];
  hasPassed: boolean;
  triesCount: number;
  status: EnrollmentStatus;
};

export const DEFAULT_PROGRESS: LearnerProgress = {
  completedLessonIds: [],
  completedSceneIds: [],
  totalSP: 0,
  sceneAnalytics: [],
  hasPassed: false,
  triesCount: 0,
  status: "NOT_STARTED",
};

function completedLessonIds(
  lessons: readonly { id: string; scenes: readonly { id: string }[] }[],
  completedScenes: ReadonlySet<string>,
) {
  return lessons
    .filter(
      (lesson) =>
        lesson.scenes.length > 0 &&
        lesson.scenes.every((scene) => completedScenes.has(scene.id)),
    )
    .map((lesson) => lesson.id);
}

function summarizeMemberProgress(
  progress: {
    sceneId: string;
    lessonId: string;
    status: string;
    spEarned: number;
    lesson: { _count: { scenes: number } };
  }[],
) {
  const completed = progress.filter((row) => row.status === "COMPLETED");
  const completedCountsByLesson = new Map<string, number>();
  for (const row of completed) {
    completedCountsByLesson.set(
      row.lessonId,
      (completedCountsByLesson.get(row.lessonId) ?? 0) + 1,
    );
  }
  const completedLessons = new Set<string>();
  for (const row of completed) {
    const totalScenes = row.lesson._count.scenes;
    if (
      totalScenes > 0 &&
      completedCountsByLesson.get(row.lessonId) === totalScenes
    ) {
      completedLessons.add(row.lessonId);
    }
  }
  return { completed, completedLessons };
}

type ProgressEnrollment = {
  id: string;
  courseVersionId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  scorePct: number | null;
  triesUsed: number;
  course: { passingScorePct: number | null } | null;
};

async function buildMemberProgress(enrollment: ProgressEnrollment) {
  const attempt = getActiveAttempt(enrollment);
  const [progress, analytics] = await Promise.all([
    db.sceneProgress.findMany({
      where: {
        enrollmentId: enrollment.id,
        attempt,
        status: { in: ["COMPLETED", "IN_PROGRESS"] },
      },
      select: {
        sceneId: true,
        lessonId: true,
        status: true,
        spEarned: true,
        lesson: {
          select: {
            _count: {
              select: {
                scenes: {
                  where: { courseVersionId: enrollment.courseVersionId },
                },
              },
            },
          },
        },
      },
    }),
    db.sceneAnalytics.findMany({
      where: { enrollmentId: enrollment.id, attempt },
      select: { sceneId: true, spEarned: true, gradedBlocks: true },
    }),
  ]);
  const { completed, completedLessons } = summarizeMemberProgress(progress);
  const completedIds = new Set(completed.map((row) => row.sceneId));
  return {
    completedLessonIds: [...completedLessons],
    completedSceneIds: [...completedIds],
    totalSP: completed.reduce((total, row) => total + row.spEarned, 0),
    sceneAnalytics: toLearnerAnalytics(analytics),
    hasPassed: evaluatePassState({
      status: enrollment.status,
      scorePct: enrollment.scorePct ?? null,
      passingScorePct: enrollment.course?.passingScorePct ?? null,
    }),
    triesCount: enrollment.triesUsed,
    status: enrollment.status,
  };
}

export async function getMemberLearnerProgress(
  userId: string,
  enrollmentId: string,
) {
  const enrollment = await db.courseEnrollment.findUnique({
    where: { id: enrollmentId, userId },
    include: { course: { select: { passingScorePct: true } } },
  });
  if (!enrollment) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Enrollment not found.",
    });
  }
  return buildMemberProgress(enrollment);
}

export async function getMemberLearnerProgressByCourseId(
  userId: string,
  courseId: string,
) {
  const enrollment = await db.courseEnrollment.findFirst({
    where: { userId, courseId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { course: { select: { passingScorePct: true } } },
  });
  if (!enrollment) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "You are not enrolled in this course.",
    });
  }
  return buildMemberProgress(enrollment);
}

export async function getAnonymousLearnerProgress(
  courseId: string,
  anonymousId: string,
) {
  const course = await requireAnonymousCourse(courseId);
  const version = await db.courseVersion.findFirst({
    where: { courseId, superseded: false },
    orderBy: { version: "desc" },
    select: {
      id: true,
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          scenes: {
            orderBy: { order: "asc" },
            select: { id: true },
          },
        },
      },
    },
  });
  if (!version) return DEFAULT_PROGRESS;
  const session = await db.anonymousCourseSession.findUnique({
    where: {
      anonymousId_courseVersionId: {
        anonymousId,
        courseVersionId: version.id,
      },
    },
  });
  if (!session) return DEFAULT_PROGRESS;

  const analytics = await db.sceneAnalytics.findMany({
    where: {
      anonymousSessionId: session.id,
      attempt: getActiveAttempt(session),
    },
    select: { sceneId: true, spEarned: true, gradedBlocks: true },
  });
  const completedIds = new Set(analytics.map((row) => row.sceneId));
  return {
    completedLessonIds: completedLessonIds(version.lessons, completedIds),
    completedSceneIds: [...completedIds],
    totalSP: analytics.reduce((total, row) => total + row.spEarned, 0),
    sceneAnalytics: toLearnerAnalytics(analytics),
    hasPassed: evaluatePassState({
      status: session.status,
      scorePct: session.scorePct,
      passingScorePct: course.passingScorePct,
    }),
    triesCount: session.triesUsed,
    status: session.status,
  };
}
