import { type TrafficSourceRow } from "./traffic-sources";

export type KpiRow = {
  enrolledCount: number;
  enrolledCompleted: number;
  enrolledInProgress: number;
  enrolledNotStarted: number;
  anonCount: number;
  anonCompleted: number;
  anonInProgress: number;
  anonNotStarted: number;
  avgTimeSeconds: number;
};

export type CompletionRow = {
  type: "enrolled" | "anonymous";
  courseVersionId: string;
  completedAt: Date;
  score: number;
};

type PerformanceRow = {
  type: "enrolled" | "anonymous";
  lessonId: string;
  sceneId: string;
  avgSpEarned: number;
  count: number;
};

export type DashboardRows = {
  allVersions: Array<{ id: string; version: number; publishedAt: Date }>;
  lessons: Array<{
    id: string;
    title: string;
    order: number;
    scenes: Array<{ id: string; title: string; order: number }>;
  }>;
  kpi: KpiRow;
  completions: CompletionRow[];
  trends: Array<{
    type: "enrolled" | "anonymous";
    day: Date;
    count: bigint;
  }>;
  performanceRows: PerformanceRow[];
  versionRows: Array<{
    type: "enrolled" | "anonymous";
    courseVersionId: string;
    status: string;
    count: number;
  }>;
  trafficRows: TrafficSourceRow[];
  scopedVersionId: string | null;
  sinceDate: Date | null;
};

export function buildCompletion(kpi: KpiRow) {
  return {
    completed: {
      enrolled: kpi.enrolledCompleted,
      anon: kpi.anonCompleted,
      total: kpi.enrolledCompleted + kpi.anonCompleted,
    },
    inProgress: {
      enrolled: kpi.enrolledInProgress,
      anon: kpi.anonInProgress,
      total: kpi.enrolledInProgress + kpi.anonInProgress,
    },
    notStarted: {
      enrolled: kpi.enrolledNotStarted,
      anon: kpi.anonNotStarted,
      total: kpi.enrolledNotStarted + kpi.anonNotStarted,
    },
  };
}

export function buildEnrollmentTrend(rows: DashboardRows["trends"]) {
  const trendMap = new Map<string, { enrolled: number; anonymous: number }>();
  for (const row of rows) {
    const key = row.day.toISOString().slice(0, 10);
    const entry = trendMap.get(key) ?? { enrolled: 0, anonymous: 0 };
    if (row.type === "enrolled") {
      entry.enrolled = Number(row.count);
    } else {
      entry.anonymous = Number(row.count);
    }
    trendMap.set(key, entry);
  }
  return Array.from(trendMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => ({ date, ...values }));
}

export const SCORE_BINS = [
  { range: "0–20%", bucket: 0 },
  { range: "20–40%", bucket: 1 },
  { range: "40–60%", bucket: 2 },
  { range: "60–80%", bucket: 3 },
  { range: "80–100%", bucket: 4 },
] as const;

export function buildScoreMetrics({
  rows,
  scopedVersionId,
  sinceDate,
}: {
  rows: CompletionRow[];
  scopedVersionId: string | null;
  sinceDate: Date | null;
}) {
  const scores = rows
    .filter((row) => {
      if (scopedVersionId && row.courseVersionId !== scopedVersionId) {
        return false;
      }
      return !(sinceDate && row.completedAt < sinceDate);
    })
    .map((row) => row.score);
  const avgScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length,
        )
      : 0;
  const bucketCounts = new Map<number, number>();
  for (const score of scores) {
    const bucket = Math.min(Math.floor(score / 20), 4);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
  }
  return {
    avgScore,
    scoreDistribution: SCORE_BINS.map((bin) => ({
      range: bin.range,
      count: bucketCounts.get(bin.bucket) ?? 0,
    })),
  };
}

type ScenePerformance = {
  id: string;
  title: string;
  enrolledAvgScore: number;
  enrolledAttempts: number;
  anonymousAvgScore: number;
  anonymousAttempts: number;
};

function indexPerformance(rows: PerformanceRow[]) {
  const index = new Map<
    string,
    Map<
      string,
      {
        enrolledAvg: number;
        enrolledCount: number;
        anonAvg: number;
        anonCount: number;
      }
    >
  >();
  for (const row of rows) {
    const lessonIndex = index.get(row.lessonId) ?? new Map();
    const scene = lessonIndex.get(row.sceneId) ?? {
      enrolledAvg: 0,
      enrolledCount: 0,
      anonAvg: 0,
      anonCount: 0,
    };
    if (row.type === "enrolled") {
      scene.enrolledAvg = Math.round(row.avgSpEarned ?? 0);
      scene.enrolledCount = row.count;
    } else {
      scene.anonAvg = Math.round(row.avgSpEarned ?? 0);
      scene.anonCount = row.count;
    }
    lessonIndex.set(row.sceneId, scene);
    index.set(row.lessonId, lessonIndex);
  }
  return index;
}

export function buildPerformance(
  lessons: DashboardRows["lessons"],
  rows: PerformanceRow[],
) {
  const performanceIndex = indexPerformance(rows);
  return lessons.map((lesson) => {
    const sceneIndex = performanceIndex.get(lesson.id);
    const scenes: ScenePerformance[] = lesson.scenes.map((scene) => {
      const performance = sceneIndex?.get(scene.id);
      return {
        id: scene.id,
        title: scene.title,
        enrolledAvgScore: performance?.enrolledAvg ?? 0,
        enrolledAttempts: performance?.enrolledCount ?? 0,
        anonymousAvgScore: performance?.anonAvg ?? 0,
        anonymousAttempts: performance?.anonCount ?? 0,
      };
    });
    return {
      id: lesson.id,
      title: lesson.title,
      enrolledAvgScore: scenes.reduce(
        (sum, scene) => sum + scene.enrolledAvgScore,
        0,
      ),
      enrolledAttempts:
        scenes.length > 0
          ? Math.max(...scenes.map((scene) => scene.enrolledAttempts))
          : 0,
      anonymousAvgScore: scenes.reduce(
        (sum, scene) => sum + scene.anonymousAvgScore,
        0,
      ),
      anonymousAttempts:
        scenes.length > 0
          ? Math.max(...scenes.map((scene) => scene.anonymousAttempts))
          : 0,
      scenes,
    };
  });
}

function groupScoresByVersion(rows: CompletionRow[]) {
  const enrolled = new Map<string, number[]>();
  const anonymous = new Map<string, number[]>();
  for (const row of rows) {
    const scores = row.type === "enrolled" ? enrolled : anonymous;
    const versionScores = scores.get(row.courseVersionId) ?? [];
    versionScores.push(row.score);
    scores.set(row.courseVersionId, versionScores);
  }
  return { enrolled, anonymous };
}

export function buildVersionStats(rows: DashboardRows) {
  const scores = groupScoresByVersion(rows.completions);
  const enrolledByVersion = new Map<string, number>();
  const anonymousByVersion = new Map<
    string,
    { completed: number; total: number }
  >();
  for (const row of rows.versionRows) {
    if (row.type === "enrolled") {
      enrolledByVersion.set(row.courseVersionId, row.count);
      continue;
    }
    const current = anonymousByVersion.get(row.courseVersionId) ?? {
      completed: 0,
      total: 0,
    };
    current.total += row.count;
    if (row.status === "COMPLETED") current.completed += row.count;
    anonymousByVersion.set(row.courseVersionId, current);
  }
  return rows.allVersions.map((version) => {
    const combinedScores = [
      ...(scores.enrolled.get(version.id) ?? []),
      ...(scores.anonymous.get(version.id) ?? []),
    ];
    return {
      ...version,
      enrolled: enrolledByVersion.get(version.id) ?? 0,
      anonSessions: anonymousByVersion.get(version.id)?.total ?? 0,
      anonCompleted: anonymousByVersion.get(version.id)?.completed ?? 0,
      avgScore:
        combinedScores.length > 0
          ? Math.round(
              combinedScores.reduce((sum, score) => sum + score, 0) /
                combinedScores.length,
            )
          : 0,
    };
  });
}
