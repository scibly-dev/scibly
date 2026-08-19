import { type RouterOutputs } from "@/shared/api/trpc/client";

export type DashboardAnalyticsOutput =
  RouterOutputs["course"]["getDashboardAnalytics"];

export const TIME_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

export type TimeRange = (typeof TIME_RANGE_OPTIONS)[number]["value"];
export type DashboardTab = "learners" | "completed" | "score" | "performance";
