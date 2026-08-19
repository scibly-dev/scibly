import { db, Prisma } from "@scibly/db";

import { type TrafficSourceRow } from "./traffic-sources";

export function loadTrafficSourceRows(scope: {
  courseId: string;
  scopedVersionId: string | null;
  sinceDate: Date | null;
}) {
  return db.$queryRaw<TrafficSourceRow[]>(Prisma.sql`
    SELECT
      "sessionSource"::text AS "source",
      "embedOrigin" AS "origin",
      COUNT(*)::int AS "sessions",
      COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS "completions",
      COUNT(*) FILTER (
        WHERE status = 'COMPLETED' AND "scorePct" IS NOT NULL
      )::int AS "scoredCompletions",
      COALESCE(
        SUM("scorePct") FILTER (
          WHERE status = 'COMPLETED' AND "scorePct" IS NOT NULL
        ),
        0
      )::float AS "scoreTotal"
    FROM "anonymous_course_session"
    WHERE "courseId" = ${scope.courseId}
      ${scope.scopedVersionId ? Prisma.sql`AND "courseVersionId" = ${scope.scopedVersionId}` : Prisma.empty}
      ${scope.sinceDate ? Prisma.sql`AND "createdAt" >= ${scope.sinceDate}` : Prisma.empty}
    GROUP BY "sessionSource", "embedOrigin";
  `);
}
