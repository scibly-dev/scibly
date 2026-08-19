import type { Prisma } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { assertAllowed, decideEnrollment } from "@scibly/api/entitlement";
import { db } from "@scibly/db";

import "server-only";

import { requireCourseAdmin } from "../../access/server/policy";
import { listEnrollmentsHelper } from "../../analytics/server/list-enrollments";

export async function listCourseEnrollments(
  userId: string,
  input: {
    courseId: string;
    limit: number;
    cursor?: number | null;
    search?: string;
    status: "all" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  },
) {
  const course = await requireCourseAdmin(input.courseId, userId, {
    select: { organizationId: true, maxTries: true },
  });
  return listEnrollmentsHelper(input, course);
}

export async function listAvailableMembers(
  userId: string,
  input: {
    courseId: string;
    search?: string;
    limit?: number | null;
    cursor?: number | null;
  },
) {
  const course = await requireCourseAdmin(input.courseId, userId, {
    select: { organizationId: true },
  });
  const limit = input.limit ?? 20;
  const offset = input.cursor ?? 0;
  const where: Prisma.MemberWhereInput = {
    organizationId: course.organizationId,
    user: {
      courseEnrollments: { none: { courseId: input.courseId } },
      OR: input.search
        ? [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
          ]
        : undefined,
    },
  };
  const members = await db.member.findMany({
    where,
    include: { user: true },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: limit + 1,
    skip: offset,
  });
  return {
    items: members.slice(0, limit).map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
    })),
    nextCursor: members.length > limit ? offset + limit : undefined,
  };
}

export async function enrollCourseMembers(
  userId: string,
  input: {
    courseId: string;
    userIds: string[];
    dueDate?: Date | null;
  },
) {
  const course = await requireCourseAdmin(input.courseId, userId);
  const latestVersion = await db.courseVersion.findFirst({
    where: { courseId: input.courseId, superseded: false },
    orderBy: { version: "desc" },
  });
  if (!latestVersion) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "The course must be published before enrolling members.",
    });
  }

  const validMembers = await db.member.findMany({
    where: {
      organizationId: course.organizationId,
      userId: { in: input.userIds },
    },
    select: { userId: true },
  });
  const validUserIds = validMembers.map((member) => member.userId);
  if (validUserIds.length === 0) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "No valid organization members provided.",
    });
  }

  const existingEnrollments = await db.courseEnrollment.findMany({
    where: {
      courseVersionId: latestVersion.id,
      userId: { in: validUserIds },
    },
    select: { userId: true },
  });
  const existingUserIds = new Set(
    existingEnrollments.map((enrollment) => enrollment.userId),
  );
  const userIdsToEnroll = validUserIds.filter(
    (candidateUserId) => !existingUserIds.has(candidateUserId),
  );
  if (userIdsToEnroll.length === 0) return { count: 0 };

  assertAllowed(
    await decideEnrollment(db, course.organizationId, {
      candidateUserIds: userIdsToEnroll,
    }),
  );
  return db.courseEnrollment.createMany({
    data: userIdsToEnroll.map((candidateUserId) => ({
      courseId: input.courseId,
      organizationId: course.organizationId,
      userId: candidateUserId,
      courseVersionId: latestVersion.id,
      dueDate: input.dueDate ?? null,
    })),
  });
}

export async function removeCourseEnrollment(
  userId: string,
  input: { courseId: string; userId: string },
) {
  await requireCourseAdmin(input.courseId, userId);
  const enrollment = await db.courseEnrollment.findFirst({
    where: { userId: input.userId, courseId: input.courseId },
  });
  if (enrollment) {
    await db.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { userId: null },
    });
  }
  return { success: true };
}
