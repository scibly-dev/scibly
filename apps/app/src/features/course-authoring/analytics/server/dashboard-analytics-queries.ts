import type {
  CompletionRow,
  DashboardRows,
  KpiRow,
} from "./dashboard-analytics-metrics";

import { db, Prisma } from "@scibly/db";

import { sumPublishedScenesMaxSp } from "@/shared/content/learning/scene-sp";

import { loadTrafficSourceRows } from "./get-traffic-sources";

interface AnalyticsScope {
  courseId: string;
  lessonVersionId?: string;
  scopedVersionId: string | null;
  sinceDate: Date | null;
}

function buildConditions(
  courseId: string,
  scopedVersionId: string | null,
  sinceDate: Date | null,
) {
  const enrolled = [
    Prisma.sql`e."courseId" = ${courseId}`,
    Prisma.sql`e."userId" IS NOT NULL`,
  ];
  const anonymous = [Prisma.sql`a."courseId" = ${courseId}`];
  if (scopedVersionId) {
    enrolled.push(Prisma.sql`e."courseVersionId" = ${scopedVersionId}`);
    anonymous.push(Prisma.sql`a."courseVersionId" = ${scopedVersionId}`);
  }
  if (sinceDate) {
    enrolled.push(Prisma.sql`e."createdAt" >= ${sinceDate}`);
    anonymous.push(Prisma.sql`a."createdAt" >= ${sinceDate}`);
  }
  return { enrolled, anonymous };
}

async function loadLessons(lessonVersionId?: string) {
  if (!lessonVersionId) return [];
  return db.lesson.findMany({
    where: { courseVersionId: lessonVersionId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      scenes: {
        where: { courseVersionId: lessonVersionId },
        orderBy: { order: "asc" },
        select: { id: true, title: true, order: true },
      },
    },
  });
}

async function loadKpi(scope: AnalyticsScope) {
  const conditions = buildConditions(
    scope.courseId,
    scope.scopedVersionId,
    scope.sinceDate,
  );
  const enrolledWhere = Prisma.sql`WHERE ${Prisma.join(conditions.enrolled, " AND ")}`;
  const anonymousWhere = Prisma.sql`WHERE ${Prisma.join(conditions.anonymous, " AND ")}`;
  const rows = await db.$queryRaw<KpiRow[]>(Prisma.sql`
    WITH enrolled_kpis AS (
      SELECT COUNT(*)::int AS "enrolledCount",
        COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END)::int AS "enrolledCompleted",
        COUNT(CASE WHEN e.status = 'IN_PROGRESS' THEN 1 END)::int AS "enrolledInProgress",
        COUNT(CASE WHEN e.status = 'NOT_STARTED' THEN 1 END)::int AS "enrolledNotStarted"
      FROM "course_enrollment" e ${enrolledWhere}
    ), anon_kpis AS (
      SELECT COUNT(*)::int AS "anonCount",
        COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END)::int AS "anonCompleted",
        COUNT(CASE WHEN a.status = 'IN_PROGRESS' THEN 1 END)::int AS "anonInProgress",
        COUNT(CASE WHEN a.status = 'NOT_STARTED' THEN 1 END)::int AS "anonNotStarted"
      FROM "anonymous_course_session" a ${anonymousWhere}
    ), avg_time AS (
      SELECT COALESCE(AVG(sp."timeSpentSeconds"), 0)::float AS "avgTimeSeconds"
      FROM "scene_progress" sp
      JOIN "course_enrollment" e ON sp."enrollmentId" = e.id
      WHERE e."courseId" = ${scope.courseId} AND e.status = 'COMPLETED' AND sp.status = 'COMPLETED'
      ${scope.scopedVersionId ? Prisma.sql`AND e."courseVersionId" = ${scope.scopedVersionId}` : Prisma.empty}
      ${scope.sinceDate ? Prisma.sql`AND sp."completedAt" >= ${scope.sinceDate}` : Prisma.empty}
    )
    SELECT e.*, a.*, t."avgTimeSeconds"
    FROM enrolled_kpis e CROSS JOIN anon_kpis a CROSS JOIN avg_time t;
  `);
  return rows[0]!;
}

type MemberCompletionSource = {
  courseVersionId: string;
  completedAt: Date | null;
  sceneProgresses: Array<{ spEarned: number }>;
};

type AnonymousCompletionSource = {
  courseVersionId: string;
  completedAt: Date | null;
  totalSpEarned: number;
};

type VersionSceneSource = {
  courseVersionId: string | null;
  maxSp: number | null;
};

function scoreAttempt(earnedSp: number, maximumSp: number) {
  if (maximumSp <= 0) return 0;
  const boundedEarnedSp = Math.min(
    maximumSp,
    Math.max(0, Number.isFinite(earnedSp) ? earnedSp : 0),
  );
  return Math.round((boundedEarnedSp / maximumSp) * 100);
}

function buildVersionMaximums(scenes: VersionSceneSource[]) {
  const scenesByVersion = new Map<string, VersionSceneSource[]>();
  for (const scene of scenes) {
    if (!scene.courseVersionId) continue;
    const versionScenes = scenesByVersion.get(scene.courseVersionId) ?? [];
    versionScenes.push(scene);
    scenesByVersion.set(scene.courseVersionId, versionScenes);
  }

  return new Map(
    Array.from(scenesByVersion, ([versionId, versionScenes]) => [
      versionId,
      sumPublishedScenesMaxSp(versionScenes),
    ]),
  );
}

function buildCompletionRows({
  anonymousCompletions,
  memberCompletions,
  versionScenes,
}: {
  anonymousCompletions: AnonymousCompletionSource[];
  memberCompletions: MemberCompletionSource[];
  versionScenes: VersionSceneSource[];
}): CompletionRow[] {
  const maximumSpByVersion = buildVersionMaximums(versionScenes);

  const memberRows = memberCompletions.flatMap(
    (completion): CompletionRow[] => {
      if (!completion.completedAt) return [];
      const earnedSp = completion.sceneProgresses.reduce(
        (sum, scene) => sum + scene.spEarned,
        0,
      );
      return [
        {
          type: "enrolled",
          courseVersionId: completion.courseVersionId,
          completedAt: completion.completedAt,
          score: scoreAttempt(
            earnedSp,
            maximumSpByVersion.get(completion.courseVersionId) ?? 0,
          ),
        },
      ];
    },
  );
  const anonymousRows = anonymousCompletions.flatMap(
    (completion): CompletionRow[] => {
      if (!completion.completedAt) return [];
      return [
        {
          type: "anonymous",
          courseVersionId: completion.courseVersionId,
          completedAt: completion.completedAt,
          score: scoreAttempt(
            completion.totalSpEarned,
            maximumSpByVersion.get(completion.courseVersionId) ?? 0,
          ),
        },
      ];
    },
  );
  return [...memberRows, ...anonymousRows];
}

async function loadCompletions(courseId: string) {
  const [memberCompletions, anonymousCompletions, versionScenes] =
    await Promise.all([
      db.courseEnrollment.findMany({
        where: { courseId, status: "COMPLETED" },
        select: {
          courseVersionId: true,
          completedAt: true,
          sceneProgresses: {
            where: { status: "COMPLETED" },
            select: { spEarned: true },
          },
        },
      }),
      db.anonymousCourseSession.findMany({
        where: { courseId, status: "COMPLETED" },
        select: {
          courseVersionId: true,
          completedAt: true,
          totalSpEarned: true,
        },
      }),
      db.scene.findMany({
        where: { courseVersion: { courseId } },
        select: {
          courseVersionId: true,
          maxSp: true,
        },
      }),
    ]);

  return buildCompletionRows({
    memberCompletions,
    anonymousCompletions,
    versionScenes,
  });
}

function loadTrends(scope: AnalyticsScope) {
  return db.$queryRaw<DashboardRows["trends"]>(Prisma.sql`
    SELECT 'enrolled' AS "type", DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
    FROM "course_enrollment" WHERE "courseId" = ${scope.courseId}
      ${scope.scopedVersionId ? Prisma.sql`AND "courseVersionId" = ${scope.scopedVersionId}` : Prisma.empty}
      ${scope.sinceDate ? Prisma.sql`AND "createdAt" >= ${scope.sinceDate}` : Prisma.empty}
    GROUP BY day
    UNION ALL
    SELECT 'anonymous' AS "type", DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
    FROM "anonymous_course_session" WHERE "courseId" = ${scope.courseId}
      ${scope.scopedVersionId ? Prisma.sql`AND "courseVersionId" = ${scope.scopedVersionId}` : Prisma.empty}
      ${scope.sinceDate ? Prisma.sql`AND "createdAt" >= ${scope.sinceDate}` : Prisma.empty}
    GROUP BY day;
  `);
}

function loadPerformance(scope: AnalyticsScope) {
  const enrolled = [Prisma.sql`e."courseId" = ${scope.courseId}`];
  const anonymous = [Prisma.sql`a."courseId" = ${scope.courseId}`];
  if (scope.scopedVersionId) {
    enrolled.push(Prisma.sql`e."courseVersionId" = ${scope.scopedVersionId}`);
    anonymous.push(Prisma.sql`a."courseVersionId" = ${scope.scopedVersionId}`);
  }
  if (scope.sinceDate) {
    enrolled.push(Prisma.sql`sa."completedAt" >= ${scope.sinceDate}`);
    anonymous.push(Prisma.sql`sa."completedAt" >= ${scope.sinceDate}`);
  }
  const enrolledWhere = Prisma.sql`WHERE ${Prisma.join(enrolled, " AND ")}`;
  const anonymousWhere = Prisma.sql`WHERE ${Prisma.join(anonymous, " AND ")}`;
  return db.$queryRaw<DashboardRows["performanceRows"]>(Prisma.sql`
    SELECT 'enrolled' AS "type", sa."lessonId", sa."sceneId",
      AVG(sa."spEarned")::float AS "avgSpEarned", COUNT(*)::int AS count
    FROM "scene_analytics" sa JOIN "course_enrollment" e ON sa."enrollmentId" = e.id
    ${enrolledWhere} GROUP BY sa."lessonId", sa."sceneId"
    UNION ALL
    SELECT 'anonymous' AS "type", sa."lessonId", sa."sceneId",
      AVG(sa."spEarned")::float AS "avgSpEarned", COUNT(*)::int AS count
    FROM "scene_analytics" sa JOIN "anonymous_course_session" a ON sa."anonymousSessionId" = a.id
    ${anonymousWhere} GROUP BY sa."lessonId", sa."sceneId";
  `);
}

function loadVersionStats(courseId: string) {
  return db.$queryRaw<DashboardRows["versionRows"]>(Prisma.sql`
    SELECT 'enrolled' AS "type", "courseVersionId", 'all' AS "status", COUNT(*)::int AS count
    FROM "course_enrollment" WHERE "courseId" = ${courseId} GROUP BY "courseVersionId"
    UNION ALL
    SELECT 'anonymous' AS "type", "courseVersionId", status::text AS "status", COUNT(*)::int AS count
    FROM "anonymous_course_session" WHERE "courseId" = ${courseId}
    GROUP BY "courseVersionId", status;
  `);
}

export async function loadDashboardAnalyticsRows(scope: AnalyticsScope) {
  const [
    lessons,
    kpi,
    completions,
    trends,
    performanceRows,
    versionRows,
    trafficRows,
  ] = await Promise.all([
    loadLessons(scope.lessonVersionId),
    loadKpi(scope),
    loadCompletions(scope.courseId),
    loadTrends(scope),
    loadPerformance(scope),
    loadVersionStats(scope.courseId),
    loadTrafficSourceRows(scope),
  ]);
  return {
    lessons,
    kpi,
    completions,
    trends,
    performanceRows,
    versionRows,
    trafficRows,
  };
}
