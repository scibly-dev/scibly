import { AppError } from "@scibly/api/application-error";
import { type db, type Prisma } from "@scibly/db";

import "server-only";

import { evaluatePassState, getActiveAttempt } from "../progression-rules";

type LearningDbClient = typeof db | Prisma.TransactionClient;

export type MemberCompletionContext = {
  courseVersionId: string;
  attempt: number;
  completedSceneIds: Set<string>;
  enrollmentId: string;
  userId: string;
  courseId: string;
  status: "active" | "finished";
  passed: boolean;
  triesUsed: number;
  maxTries: number | null;
};

export type AnonymousCompletionContext = {
  courseVersionId: string;
  attempt: number;
  completedSceneIds: Set<string>;
  anonymousSessionId: string;
  status: "active" | "finished";
  passed: boolean;
  triesUsed: number;
  maxTries: number | null;
};

export async function loadMemberCompletionContext(identifier: {
  client: LearningDbClient;
  userId: string;
  enrollmentId: string;
}): Promise<MemberCompletionContext> {
  const enrollment = await identifier.client.courseEnrollment.findUnique({
    where: { id: identifier.enrollmentId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      courseVersionId: true,
      status: true,
      triesUsed: true,
      scorePct: true,
      course: { select: { maxTries: true, passingScorePct: true } },
      courseVersion: { select: { superseded: true } },
    },
  });
  if (!enrollment || enrollment.userId !== identifier.userId) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Not enrolled in this course.",
    });
  }
  if (enrollment.courseVersion.superseded) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "api.forbidden",
      message:
        "This course version has been superseded. Please reload the page to get the latest version.",
    });
  }

  const attempt = getActiveAttempt(enrollment);
  const progress = await identifier.client.sceneProgress.findMany({
    where: { enrollmentId: enrollment.id, attempt, status: "COMPLETED" },
    select: { sceneId: true },
  });

  return {
    courseVersionId: enrollment.courseVersionId,
    attempt,
    completedSceneIds: new Set(progress.map((row) => row.sceneId)),
    enrollmentId: enrollment.id,
    userId: identifier.userId,
    courseId: enrollment.courseId,
    status: enrollment.status === "COMPLETED" ? "finished" : "active",
    passed: evaluatePassState({
      status: enrollment.status,
      scorePct: enrollment.scorePct,
      passingScorePct: enrollment.course.passingScorePct,
    }),
    triesUsed: enrollment.triesUsed,
    maxTries: enrollment.course.maxTries,
  };
}

export async function loadAnonymousCompletionContext(identifier: {
  client: LearningDbClient;
  anonymousId: string;
  courseVersionId: string;
  maxTries: number | null;
  passingScorePct: number | null;
}): Promise<AnonymousCompletionContext> {
  const session = await identifier.client.anonymousCourseSession.findUnique({
    where: {
      anonymousId_courseVersionId: {
        anonymousId: identifier.anonymousId,
        courseVersionId: identifier.courseVersionId,
      },
    },
    select: {
      id: true,
      status: true,
      triesUsed: true,
      courseVersionId: true,
      scorePct: true,
    },
  });
  if (!session) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Anonymous session not found.",
    });
  }

  const attempt = getActiveAttempt(session);
  const analytics = await identifier.client.sceneAnalytics.findMany({
    where: { anonymousSessionId: session.id, attempt },
    select: { sceneId: true },
  });
  return {
    courseVersionId: session.courseVersionId,
    attempt,
    completedSceneIds: new Set(analytics.map((row) => row.sceneId)),
    anonymousSessionId: session.id,
    status: session.status === "COMPLETED" ? "finished" : "active",
    passed: evaluatePassState({
      status: session.status,
      scorePct: session.scorePct,
      passingScorePct: identifier.passingScorePct,
    }),
    triesUsed: session.triesUsed,
    maxTries: identifier.maxTries,
  };
}

export async function loadAuthoritativeSceneIds(
  client: LearningDbClient,
  courseVersionId: string,
) {
  const lessons = await client.lesson.findMany({
    where: { courseVersionId },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: {
      scenes: {
        where: { courseVersionId },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: { id: true },
      },
    },
  });
  return lessons.flatMap((lesson) => lesson.scenes.map((scene) => scene.id));
}
