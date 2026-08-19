import { Prisma } from "@scibly/db";

import "server-only";

import {
  computeScorePct,
  hasAttemptsRemaining,
  passesScore,
} from "../progression-rules";
import { computeCourseMaxSp } from "./grading";

type CompletedEnrollment = NonNullable<
  Awaited<ReturnType<typeof loadEnrollmentForCompletion>>
>;

function loadEnrollmentForCompletion(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
) {
  return tx.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true, user: true },
  });
}

async function issueCertificate(
  tx: Prisma.TransactionClient,
  params: {
    enrollment: CompletedEnrollment;
    courseVersionId: string;
    userId: string;
    totalSpEarned: number;
    completedAt: Date;
  },
) {
  const version = await tx.courseVersion.findUnique({
    where: { id: params.courseVersionId },
    select: { version: true },
  });
  if (!version) return;

  try {
    await tx.certificate.create({
      data: {
        enrollmentId: params.enrollment.id,
        courseVersionId: params.courseVersionId,
        userId: params.userId,
        organizationId: params.enrollment.course.organizationId,
        userName: params.enrollment.user?.name ?? "Deleted User",
        courseName: params.enrollment.course.title,
        versionNumber: version.version,
        completedAt: params.completedAt,
        totalSpEarned: params.totalSpEarned,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }
    throw error;
  }
}

export async function finishMemberCourseWhenComplete(
  tx: Prisma.TransactionClient,
  context: {
    enrollmentId: string;
    courseVersionId: string;
    userId: string;
  },
) {
  const [totalScenes, completedProgress, enrollment] = await Promise.all([
    tx.scene.count({ where: { courseVersionId: context.courseVersionId } }),
    tx.sceneProgress.findMany({
      where: { enrollmentId: context.enrollmentId, status: "COMPLETED" },
      select: { spEarned: true },
    }),
    loadEnrollmentForCompletion(tx, context.enrollmentId),
  ]);
  if (!enrollment) return;

  const completed = totalScenes > 0 && completedProgress.length >= totalScenes;
  if (!completed) {
    await tx.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "IN_PROGRESS",
        lastActive: new Date(),
        completedAt: null,
      },
    });
    return;
  }

  const completedAt = new Date();
  const totalSpEarned = completedProgress.reduce(
    (total, progress) => total + progress.spEarned,
    0,
  );
  const possibleSp = await computeCourseMaxSp(tx, context.courseVersionId);
  const scorePct = computeScorePct(totalSpEarned, possibleSp);

  const updated = await tx.courseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      status: "COMPLETED",
      lastActive: new Date(),
      completedAt,
      scorePct,
      triesUsed: { increment: 1 },
    },
  });

  const passed = passesScore(scorePct, enrollment.course.passingScorePct);
  const attemptAllowed = hasAttemptsRemaining(
    updated.triesUsed - 1,
    enrollment.course.maxTries,
  );
  if (!passed || !attemptAllowed) return;

  await issueCertificate(tx, {
    enrollment,
    courseVersionId: context.courseVersionId,
    userId: context.userId,
    totalSpEarned,
    completedAt,
  });
}
