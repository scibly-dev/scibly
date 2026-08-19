import { type RouterOutputs } from "@/shared/api/trpc/client";

type DashboardAnalyticsOutput =
  RouterOutputs["course"]["getDashboardAnalytics"];
export type LessonPerf = DashboardAnalyticsOutput["performance"][number];
export type ScenePerf = LessonPerf["scenes"][number];

type BlockAnalyticsOutput = RouterOutputs["course"]["getBlockAnalytics"];
export type BlockData = BlockAnalyticsOutput[number];
export type ScoreDistributionItem = BlockData["scoreDistribution"][number];
