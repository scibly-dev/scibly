import { db, type Prisma } from "@scibly/db";
import { type z } from "zod";

import { getActiveAttempt } from "@/features/learning/server";

import { type listEnrollmentsSchema } from "../../courses/api/course.schema";

function buildEnrollmentWhere(
  input: z.infer<typeof listEnrollmentsSchema>,
): Prisma.CourseEnrollmentWhereInput {
  return {
    courseId: input.courseId,
    userId: { not: null },
    status: input.status === "all" ? undefined : input.status,
    user: input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : undefined,
  };
}

function loadEnrollmentPage(
  input: z.infer<typeof listEnrollmentsSchema>,
  offset: number,
) {
  const where = buildEnrollmentWhere(input);
  return Promise.all([
    db.courseEnrollment.count({ where }),
    db.courseEnrollment.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, image: true } },
        courseVersion: { select: { version: true } },
        certificate: { select: { id: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: input.limit + 1,
      skip: offset,
    }),
  ]);
}

type PageEnrollment = Awaited<ReturnType<typeof loadEnrollmentPage>>[1][number];

async function loadProgressCounts(enrollments: PageEnrollment[]) {
  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
  const versionIds = [
    ...new Set(enrollments.map((enrollment) => enrollment.courseVersionId)),
  ];

  const [completedProgress, sceneCounts] = await Promise.all([
    db.sceneProgress.findMany({
      where: { enrollmentId: { in: enrollmentIds }, status: "COMPLETED" },
      select: { enrollmentId: true, attempt: true },
    }),
    db.scene.groupBy({
      by: ["courseVersionId"],
      where: { courseVersionId: { in: versionIds } },
      _count: { id: true },
    }),
  ]);

  const totalScenesByVersion = new Map(
    sceneCounts.map((row) => [row.courseVersionId, row._count.id]),
  );
  const completedByEnrollmentAndAttempt = new Map<string, number>();
  for (const row of completedProgress) {
    const key = `${row.enrollmentId}:${row.attempt}`;
    completedByEnrollmentAndAttempt.set(
      key,
      (completedByEnrollmentAndAttempt.get(key) ?? 0) + 1,
    );
  }

  return { totalScenesByVersion, completedByEnrollmentAndAttempt };
}

function mapEnrollment(
  enrollment: PageEnrollment,
  totalScenesByVersion: Map<string | null, number>,
  completedByEnrollmentAndAttempt: Map<string, number>,
) {
  const activeAttempt = getActiveAttempt(enrollment);
  const completedScenes =
    completedByEnrollmentAndAttempt.get(`${enrollment.id}:${activeAttempt}`) ??
    0;
  const totalScenes = totalScenesByVersion.get(enrollment.courseVersionId) ?? 0;
  const progressPercentage =
    totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  return {
    id: enrollment.id,
    userId: enrollment.userId,
    name: enrollment.user?.name ?? null,
    email: enrollment.user?.email ?? "",
    image: enrollment.user?.image ?? null,
    status: enrollment.status,
    progress: progressPercentage,
    lastActive: enrollment.lastActive,
    createdAt: enrollment.createdAt,
    triesUsed: enrollment.triesUsed,
    hasCertificate: enrollment.certificate !== null,
    version: enrollment.courseVersion.version,
  };
}

export async function listEnrollmentsHelper(
  input: z.infer<typeof listEnrollmentsSchema>,
  course: { maxTries: number | null },
) {
  const offset = input.cursor ?? 0;
  const [totalCount, enrollments] = await loadEnrollmentPage(input, offset);

  if (enrollments.length === 0) {
    return {
      items: [],
      nextCursor: undefined,
      totalCount,
      maxTries: course.maxTries,
    };
  }

  const pageEnrollments = enrollments.slice(0, input.limit);
  const nextCursor =
    enrollments.length > input.limit ? offset + input.limit : undefined;

  const { totalScenesByVersion, completedByEnrollmentAndAttempt } =
    await loadProgressCounts(pageEnrollments);

  const items = pageEnrollments.map((enrollment) =>
    mapEnrollment(
      enrollment,
      totalScenesByVersion,
      completedByEnrollmentAndAttempt,
    ),
  );

  return { items, nextCursor, totalCount, maxTries: course.maxTries };
}
