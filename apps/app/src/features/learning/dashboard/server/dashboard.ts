import { db } from "@scibly/db";

import "server-only";
import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "@/features/organizations/server";

async function requireLearnerOrganization(userId: string, orgSlug: string) {
  const organization = await requireOrganizationBySlug(orgSlug);
  await requireOrgMember(organization.id, userId, "member");
  return organization;
}

export async function listEnrolledCourses(
  userId: string,
  input: { orgSlug: string; limit: number; cursor: number },
) {
  const organization = await requireLearnerOrganization(userId, input.orgSlug);
  const enrollmentFilter = {
    userId,
    course: { organizationId: organization.id },
  } as const;
  const [rawItems, groupedCourses] = await Promise.all([
    db.courseEnrollment.findMany({
      take: input.limit + 1,
      skip: input.cursor,
      where: enrollmentFilter,
      distinct: ["courseId"],
      include: {
        course: true,
        courseVersion: {
          include: {
            _count: { select: { lessons: true } },
            lessons: { select: { estimatedTimeToCompleteMinutes: true } },
          },
        },
      },
      orderBy: [{ courseId: "asc" }, { updatedAt: "desc" }],
    }),
    db.courseEnrollment.groupBy({
      by: ["courseId"],
      where: enrollmentFilter,
      _count: { _all: true },
    }),
  ]);
  const items = rawItems.slice(0, input.limit);
  const courseIds = items.map((enrollment) => enrollment.courseId);
  const certificates =
    courseIds.length === 0
      ? []
      : await db.certificate.findMany({
          where: {
            userId,
            courseVersion: { courseId: { in: courseIds } },
          },
          select: { courseVersion: { select: { courseId: true } } },
        });
  const certifiedCourseIds = new Set(
    certificates.flatMap((certificate) =>
      certificate.courseVersion?.courseId
        ? [certificate.courseVersion.courseId]
        : [],
    ),
  );

  return {
    items: items.map((enrollment) => ({
      enrollmentId: enrollment.id,
      status: enrollment.status,
      completedAt: enrollment.completedAt,
      lastActive: enrollment.lastActive,
      dueDate: enrollment.dueDate,
      triesCount: enrollment.triesUsed,
      hasCertificate: certifiedCourseIds.has(enrollment.courseId),
      course: {
        ...enrollment.course,
        _count: { lessons: enrollment.courseVersion._count.lessons },
        totalEstimatedTimeMinutes: enrollment.courseVersion.lessons.reduce(
          (total, lesson) => total + lesson.estimatedTimeToCompleteMinutes,
          0,
        ),
      },
    })),
    nextCursor:
      rawItems.length > input.limit ? input.cursor + input.limit : undefined,
    totalCount: groupedCourses.length,
  };
}

export async function getLearnerDashboardStats(
  userId: string,
  orgSlug: string,
) {
  const organization = await requireLearnerOrganization(userId, orgSlug);
  const enrollmentFilter = {
    userId,
    course: { organizationId: organization.id },
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [statusGroups, spResult, recentActivity, upcomingDue] =
    await loadDashboardStats(enrollmentFilter, today);
  const recentVersionIds = recentActivity.map(
    (enrollment) => enrollment.courseVersionId,
  );
  const recentCertificates =
    recentVersionIds.length === 0
      ? []
      : await db.certificate.findMany({
          where: {
            userId,
            courseVersionId: { in: recentVersionIds },
          },
          select: { courseVersionId: true },
        });
  const certifiedVersionIds = new Set(
    recentCertificates.map((certificate) => certificate.courseVersionId),
  );
  const statusMap = Object.fromEntries(
    statusGroups.map((group) => [group.status, group._count._all]),
  );

  return {
    totalSP: spResult._sum.spEarned ?? 0,
    completedCourses: statusMap.COMPLETED ?? 0,
    inProgressCourses: statusMap.IN_PROGRESS ?? 0,
    totalCourses: Object.values(statusMap).reduce(
      (total, count) => total + count,
      0,
    ),
    recentActivity: recentActivity.map((enrollment) => ({
      enrollmentId: enrollment.id,
      status: enrollment.status,
      lastActive: enrollment.lastActive,
      course: enrollment.course,
      hasCertificate: certifiedVersionIds.has(enrollment.courseVersionId),
    })),
    upcomingDue: upcomingDue.map((enrollment) => ({
      enrollmentId: enrollment.id,
      dueDate: enrollment.dueDate!,
      course: enrollment.course,
    })),
  };
}

async function loadDashboardStats(
  enrollmentFilter: {
    userId: string;
    course: { organizationId: string };
  },
  today: Date,
) {
  const [statusGroups, spResult, recentActivity, upcomingDue] =
    await Promise.all([
      db.courseEnrollment.groupBy({
        by: ["status"],
        where: enrollmentFilter,
        _count: { _all: true },
      }),
      db.sceneProgress.aggregate({
        where: { enrollment: enrollmentFilter },
        _sum: { spEarned: true },
      }),
      db.courseEnrollment.findMany({
        where: { ...enrollmentFilter, status: { not: "NOT_STARTED" } },
        orderBy: { lastActive: "desc" },
        take: 3,
        include: {
          course: { select: { id: true, title: true, thumbnail: true } },
        },
      }),
      db.courseEnrollment.findMany({
        where: {
          ...enrollmentFilter,
          status: { not: "COMPLETED" },
          dueDate: { gte: today },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: { course: { select: { id: true, title: true } } },
      }),
    ]);
  return [statusGroups, spResult, recentActivity, upcomingDue] as const;
}
