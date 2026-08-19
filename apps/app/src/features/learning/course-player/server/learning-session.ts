import type { Prisma } from "@scibly/db";
import type { JSONContent } from "@tiptap/core";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import "server-only";
import { requireOrgMember } from "@/features/organizations/server";
import { lockEnrollmentAttempt } from "@/lib/db/transaction-locks";

import {
  passesScore,
  transitionAttempt,
} from "../../progression/progression-rules";
import { createLearnerLessonSelect, mapLearnerLessons } from "./learner-course";

async function findEnrollment(userId: string, courseId: string) {
  const enrollment = await db.courseEnrollment.findFirst({
    where: { userId, courseId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      courseVersion: true,
      course: { select: { organizationId: true } },
    },
  });
  if (!enrollment) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "You are not enrolled in this course.",
    });
  }
  return enrollment;
}

function deleteAttemptState(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
) {
  return Promise.all([
    tx.sceneProgress.deleteMany({ where: { enrollmentId } }),
    tx.sceneAnalytics.deleteMany({ where: { enrollmentId } }),
  ]);
}

type Enrollment = Awaited<ReturnType<typeof findEnrollment>>;

function notEnrolledError() {
  return new AppError({
    code: "NOT_FOUND",
    applicationCode: "api.not_found",
    message: "You are not enrolled in this course.",
  });
}

async function findNewerVersion(enrollment: Enrollment, courseId: string) {
  const latestVersion = await db.courseVersion.findFirst({
    where: { courseId, superseded: false },
    orderBy: { version: "desc" },
  });
  if (!latestVersion || latestVersion.id === enrollment.courseVersionId) {
    return null;
  }
  return latestVersion;
}

// Wipes scene progress unconditionally: safe only because callers only reach this for a NOT_STARTED enrollment or after explicit confirmation via confirmVersionUpdate.
async function switchToVersion(
  enrollment: Enrollment,
  latestVersion: { id: string },
): Promise<Enrollment> {
  return db.$transaction(async (tx) => {
    await lockEnrollmentAttempt(tx, enrollment.id);
    const locked = await tx.courseEnrollment.findFirst({
      where: { id: enrollment.id },
      include: {
        courseVersion: true,
        course: { select: { organizationId: true } },
      },
    });
    if (!locked) throw notEnrolledError();
    if (locked.courseVersionId !== enrollment.courseVersionId) return locked;
    await deleteAttemptState(tx, locked.id);
    return tx.courseEnrollment.update({
      where: { id: locked.id },
      data: {
        courseVersionId: latestVersion.id,
        status: "NOT_STARTED",
        completedAt: null,
        lastActive: new Date(),
      },
      include: {
        courseVersion: true,
        course: { select: { organizationId: true } },
      },
    });
  });
}

// Re-validates pass/fail and tries-remaining against the locked row, not the
// caller's snapshot, so a stale confirmation can't resurrect a dead attempt.
async function reopenFailedAttempt(
  enrollment: Enrollment,
  passingScorePct: number | null,
  maxTries: number | null,
): Promise<Enrollment> {
  return db.$transaction(async (tx) => {
    await lockEnrollmentAttempt(tx, enrollment.id);
    const locked = await tx.courseEnrollment.findFirst({
      where: { id: enrollment.id },
      include: {
        courseVersion: true,
        course: { select: { organizationId: true } },
      },
    });
    if (!locked) throw notEnrolledError();
    const transition = transitionAttempt(
      locked.status === "COMPLETED"
        ? {
            status: "finished",
            completedSceneIds: new Set(),
            passed: passesScore(locked.scorePct, passingScorePct),
            triesUsed: locked.triesUsed,
            maxTries,
          }
        : { status: "active", completedSceneIds: new Set() },
      { type: "reopen-failed-attempt" },
    );
    if (transition.kind !== "accepted") return locked;
    await deleteAttemptState(tx, locked.id);
    return tx.courseEnrollment.update({
      where: { id: locked.id },
      data: {
        status: "IN_PROGRESS",
        completedAt: null,
        lastActive: new Date(),
      },
      include: {
        courseVersion: true,
        course: { select: { organizationId: true } },
      },
    });
  });
}

type PendingSessionAction = "retry" | "version-update" | null;

function toSessionResult(
  enrollment: Enrollment,
  courseTitle: string,
  pendingAction: PendingSessionAction,
) {
  return {
    enrollmentId: enrollment.id,
    courseVersionId: enrollment.courseVersionId,
    status: enrollment.status,
    courseTitle,
    pendingAction,
  };
}

async function loadCourseForSession(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true, maxTries: true, passingScorePct: true },
  });
  if (!course) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Course not found.",
    });
  }
  return course;
}

// Read-only except for a NOT_STARTED enrollment, which has no attempt to lose; other destructive
// transitions are surfaced via `pendingAction` and require confirmation through confirmRetryAttempt / confirmVersionUpdate.
export async function openLearningSession(userId: string, courseId: string) {
  let enrollment = await findEnrollment(userId, courseId);
  await requireOrgMember(enrollment.course.organizationId, userId, "member");
  const course = await loadCourseForSession(courseId);

  const newerVersion = await findNewerVersion(enrollment, courseId);
  if (newerVersion) {
    if (enrollment.status !== "NOT_STARTED") {
      return toSessionResult(enrollment, course.title, "version-update");
    }
    enrollment = await switchToVersion(enrollment, newerVersion);
  }

  const passed = passesScore(enrollment.scorePct, course.passingScorePct);
  if (
    enrollment.status === "COMPLETED" &&
    !passed &&
    (course.maxTries === null || enrollment.triesUsed < course.maxTries)
  ) {
    return toSessionResult(enrollment, course.title, "retry");
  }

  return toSessionResult(enrollment, course.title, null);
}

export async function confirmRetryAttempt(userId: string, courseId: string) {
  const enrollment = await findEnrollment(userId, courseId);
  await requireOrgMember(enrollment.course.organizationId, userId, "member");
  const course = await loadCourseForSession(courseId);
  const updated = await reopenFailedAttempt(
    enrollment,
    course.passingScorePct,
    course.maxTries,
  );
  return toSessionResult(updated, course.title, null);
}

export async function confirmVersionUpdate(userId: string, courseId: string) {
  const enrollment = await findEnrollment(userId, courseId);
  await requireOrgMember(enrollment.course.organizationId, userId, "member");
  const course = await loadCourseForSession(courseId);
  const newerVersion = await findNewerVersion(enrollment, courseId);
  const updated = newerVersion
    ? await switchToVersion(enrollment, newerVersion)
    : enrollment;
  return toSessionResult(updated, course.title, null);
}

export async function getLearnerCourse(userId: string, courseId: string) {
  const enrollment = await findEnrollment(userId, courseId);
  const [course, certificate] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        mode: true,
        thumbnail: true,
        passingScorePct: true,
        maxTries: true,
        organizationId: true,
        lessons: {
          where: { courseVersionId: enrollment.courseVersionId },
          orderBy: { order: "asc" },
          select: createLearnerLessonSelect(enrollment.courseVersionId),
        },
      },
    }),
    db.certificate.findFirst({
      where: {
        userId,
        courseVersionId: enrollment.courseVersionId,
      },
      select: { id: true },
    }),
  ]);
  if (!course) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Course not found.",
    });
  }
  await requireOrgMember(course.organizationId, userId, "member");
  const lessons = mapLearnerLessons(course.lessons);

  return {
    id: course.id,
    title: course.title,
    mode: course.mode,
    thumbnail: course.thumbnail,
    passingScorePct: course.passingScorePct,
    maxTries: course.maxTries,
    lessons,
    maxSp: lessons.reduce((total, lesson) => total + lesson.maxSp, 0),
    enrollmentId: enrollment.id,
    status: enrollment.status,
    courseVersionId: enrollment.courseVersionId,
    version: enrollment.courseVersion.version,
    triesCount: enrollment.triesUsed,
    hasCertificate: certificate !== null,
  };
}

export async function getLearnerSceneContent(
  userId: string,
  courseId: string,
  sceneId: string,
) {
  const enrollment = await findEnrollment(userId, courseId);
  await requireOrgMember(enrollment.course.organizationId, userId, "member");
  const scene = await db.scene.findFirst({
    where: {
      id: sceneId,
      courseVersionId: enrollment.courseVersionId,
      lesson: { courseId, courseVersionId: enrollment.courseVersionId },
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
