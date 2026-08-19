import "server-only";

import { requireCourseAdmin } from "../../access/server/policy";
import { getBlockAnalyticsHelper } from "./get-block-analytics";
import { getCourseStatsHelper } from "./get-course-stats";
import { getDashboardAnalyticsHelper } from "./get-dashboard-analytics";

export async function getCourseStats(userId: string, courseId: string) {
  const course = await requireCourseAdmin(courseId, userId, {
    select: {
      organizationId: true,
      _count: {
        select: { lessons: { where: { courseVersionId: null } } },
      },
    },
  });
  return getCourseStatsHelper(courseId, course._count.lessons);
}

export async function getCourseDashboardAnalytics(
  userId: string,
  input: {
    courseId: string;
    timeRange: "7d" | "30d" | "90d" | "all";
    lessonId?: string;
    sceneId?: string;
    versionId?: string;
  },
) {
  await requireCourseAdmin(input.courseId, userId);
  return getDashboardAnalyticsHelper(input.courseId, input);
}

export async function getCourseBlockAnalytics(
  userId: string,
  input: { courseId: string; sceneId: string },
) {
  await requireCourseAdmin(input.courseId, userId);
  return getBlockAnalyticsHelper(input);
}
