import { db, Prisma } from "@scibly/db";
import { formatDurationMs } from "@scibly/lib";

type CourseStatsRow = {
  totalEnrolled: number;
  activeThisWeek: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  totalCompletionTimeSeconds: number;
  anonCompletedCount: number;
  anonInProgressCount: number;
  anonNotStartedCount: number;
  avgScorePct: number;
};

function loadCourseStats(courseId: string, oneWeekAgo: Date) {
  return db.$queryRaw<CourseStatsRow[]>(Prisma.sql`
    WITH enrollment_stats AS (
      SELECT
        COUNT(*)::int AS "totalEnrolled",
        COUNT(CASE WHEN "lastActive" >= ${oneWeekAgo} THEN 1 END)::int AS "activeThisWeek",
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int AS "completedCount",
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::int AS "inProgressCount",
        COUNT(CASE WHEN status = 'NOT_STARTED' THEN 1 END)::int AS "notStartedCount"
      FROM "course_enrollment"
      WHERE "courseId" = ${courseId}
    ),
    completion_time AS (
      SELECT COALESCE(SUM(sp."timeSpentSeconds"), 0)::int AS "totalCompletionTimeSeconds"
      FROM "scene_progress" sp
      JOIN "course_enrollment" e ON sp."enrollmentId" = e.id
      WHERE e."courseId" = ${courseId} AND e.status = 'COMPLETED'
    ),
    anon_stats AS (
      SELECT
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int AS "anonCompletedCount",
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::int AS "anonInProgressCount",
        COUNT(CASE WHEN status = 'NOT_STARTED' THEN 1 END)::int AS "anonNotStartedCount",
        COALESCE(AVG(CASE WHEN status = 'COMPLETED' AND "scorePct" IS NOT NULL THEN "scorePct" END), 0)::float AS "avgScorePct"
      FROM "anonymous_course_session"
      WHERE "courseId" = ${courseId}
    )
    SELECT
      e."totalEnrolled",
      e."activeThisWeek",
      e."completedCount",
      e."inProgressCount",
      e."notStartedCount",
      t."totalCompletionTimeSeconds",
      a."anonCompletedCount",
      a."anonInProgressCount",
      a."anonNotStartedCount",
      a."avgScorePct"
    FROM enrollment_stats e
    CROSS JOIN completion_time t
    CROSS JOIN anon_stats a;
  `);
}

function buildCourseStats(row: CourseStatsRow, totalLessons: number) {
  const totalAnonSessions =
    row.anonCompletedCount + row.anonInProgressCount + row.anonNotStartedCount;
  const totalAll = row.totalEnrolled + totalAnonSessions;
  const totalCompletionTimeMs = row.totalCompletionTimeSeconds * 1000;

  const toPct = (count: number) =>
    totalAll > 0 ? Math.round((count / totalAll) * 100) : 0;
  const avgTimeToCompleteMs =
    row.completedCount > 0 ? totalCompletionTimeMs / row.completedCount : 0;

  return {
    totalEnrolled: totalAll,
    activeThisWeek: row.activeThisWeek,
    completedCount: row.completedCount,
    inProgressCount: row.inProgressCount,
    notStartedCount: row.notStartedCount,
    totalCompletionTimeMs,
    pctCompleted: toPct(row.completedCount + row.anonCompletedCount),
    pctInProgress: toPct(row.inProgressCount + row.anonInProgressCount),
    pctNotStarted: toPct(row.notStartedCount + row.anonNotStartedCount),
    avgTimeToComplete: formatDurationMs(avgTimeToCompleteMs),
    avgScore: Math.round(row.avgScorePct),
    totalLessons,
    anonymousSessions: {
      total: totalAnonSessions,
      completed: row.anonCompletedCount,
      inProgress: row.anonInProgressCount,
      notStarted: row.anonNotStartedCount,
    },
  };
}

export async function getCourseStatsHelper(
  courseId: string,
  totalLessons: number,
) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const stats = await loadCourseStats(courseId, oneWeekAgo);
  return buildCourseStats(stats[0]!, totalLessons);
}
