import {
  buildCompletion,
  buildEnrollmentTrend,
  buildPerformance,
  buildScoreMetrics,
  buildVersionStats,
  type DashboardRows,
} from "./dashboard-analytics-metrics";
import { buildTrafficSources } from "./traffic-sources";

export function buildDashboardAnalyticsResult(rows: DashboardRows) {
  const { avgScore, scoreDistribution } = buildScoreMetrics({
    rows: rows.completions,
    scopedVersionId: rows.scopedVersionId,
    sinceDate: rows.sinceDate,
  });
  return {
    lessons: rows.lessons,
    versions: rows.allVersions,
    versionStats: buildVersionStats(rows),
    kpis: {
      enrolled: {
        total: rows.kpi.enrolledCount,
        completed: rows.kpi.enrolledCompleted,
      },
      anonymous: {
        total: rows.kpi.anonCount,
        completed: rows.kpi.anonCompleted,
      },
      avgScore,
      avgTimeSeconds: Math.round(rows.kpi.avgTimeSeconds),
    },
    enrollmentTrend: buildEnrollmentTrend(rows.trends),
    completion: buildCompletion(rows.kpi),
    scoreDistribution,
    performance: buildPerformance(rows.lessons, rows.performanceRows),
    trafficSources: buildTrafficSources(rows.trafficRows),
  };
}
