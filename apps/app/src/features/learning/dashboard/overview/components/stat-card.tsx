import { cardClass, cardInteractiveClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { BookOpen, CheckCircle2, Clock, Zap } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { type StatConfig, type Stats } from "../i18n/dashboard-overview.types";

export const STAT_CONFIGS: StatConfig[] = [
  {
    key: "totalSP",
    icon: Zap,
    color: "text-blue-700",
    bg: "bg-blue-200 shadow-[0_3px_0_0_var(--color-blue-400)] dark:bg-blue-500/10",
    format: (v) => v.toLocaleString(),
  },
  {
    key: "completedCourses",
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-200 shadow-[0_3px_0_0_var(--color-green-400)] dark:bg-green-500/10",
    format: (v) => String(v),
  },
  {
    key: "inProgressCourses",
    icon: Clock,
    color: "text-orange-700",
    bg: "bg-orange-200 shadow-[0_3px_0_0_var(--color-orange-400)] dark:bg-orange-500/10",
    format: (v) => String(v),
  },
  {
    key: "totalCourses",
    icon: BookOpen,
    color: "text-purple-700",
    bg: "bg-purple-200 shadow-[0_3px_0_0_var(--color-purple-400)] dark:bg-purple-500/10",
    format: (v) => String(v),
  },
];

interface StatCardProps {
  config: StatConfig;
  stats: Stats;
}

export function StatCard({ config, stats }: StatCardProps) {
  const { translations } = useTranslation("learn");
  const t = translations.stats;

  const labelMap = {
    totalSP: t.totalSP,
    completedCourses: t.completed,
    inProgressCourses: t.inProgress,
    totalCourses: t.enrolled,
  } satisfies Record<StatConfig["key"], string>;

  const label = labelMap[config.key];
  const value = config.format(stats[config.key]);

  return (
    <div
      className={cn(
        cardClass,
        cardInteractiveClass,
        "flex flex-col gap-4 p-6 dark:border-neutral-800 dark:bg-neutral-900",
      )}
    >
      <div
        className={`flex size-10 items-center justify-center rounded-[12px] ${config.bg}`}
      >
        <config.icon
          className={`size-[19px] ${config.color}`}
          strokeWidth={2.4}
        />
      </div>
      <div>
        <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
        <p className="text-foreground mt-0.5 text-3xl font-bold tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
