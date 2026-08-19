import { type LucideIcon } from "lucide-react";

import { type RouterOutputs } from "@/shared/api/trpc/contracts";

export interface DashboardOverviewTranslations {
  stats: {
    totalSP: string;
    completed: string;
    inProgress: string;
    enrolled: string;
  };
  overview: {
    recentActivity: string;
    viewAll: string;
    noActivity: string;
    upcomingDeadlines: string;
    noDeadlines: string;
    active: string;
    dueInDay: string;
    dueInDays: string;
  };
}

export type Stats = RouterOutputs["learning"]["getDashboardStats"];

export interface StatConfig {
  key: keyof Pick<
    Stats,
    "totalSP" | "completedCourses" | "inProgressCourses" | "totalCourses"
  >;
  icon: LucideIcon;
  color: string;
  bg: string;
  format: (v: number) => string;
}
