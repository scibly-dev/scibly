import { db } from "@scibly/db";
import { type z } from "zod";

import { type getDashboardAnalyticsSchema } from "../../courses/api/course.schema";
import { loadDashboardAnalyticsRows } from "./dashboard-analytics-queries";
import { buildDashboardAnalyticsResult } from "./dashboard-analytics-result";

function resolveSinceDate(
  timeRange: z.infer<typeof getDashboardAnalyticsSchema>["timeRange"],
) {
  if (timeRange === "all") return null;
  const days = { "7d": 7, "30d": 30, "90d": 90 } as const;
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days[timeRange]);
  return sinceDate;
}

export async function getDashboardAnalyticsHelper(
  courseId: string,
  input: z.infer<typeof getDashboardAnalyticsSchema>,
) {
  const allVersions = await db.courseVersion.findMany({
    where: { courseId },
    orderBy: { version: "desc" },
    select: { id: true, version: true, publishedAt: true },
  });
  const latestVersion = allVersions[0];
  const scopedVersionId =
    input.versionId === "all"
      ? null
      : (input.versionId ?? latestVersion?.id ?? null);
  const sinceDate = resolveSinceDate(input.timeRange);
  const rows = await loadDashboardAnalyticsRows({
    courseId,
    lessonVersionId: scopedVersionId ?? latestVersion?.id,
    scopedVersionId,
    sinceDate,
  });

  return buildDashboardAnalyticsResult({
    allVersions,
    ...rows,
    scopedVersionId,
    sinceDate,
  });
}
