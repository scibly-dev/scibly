import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { GitBranch } from "lucide-react";
import React from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { LessonPerformanceView } from "../../lesson-performance-view";
import { type DashboardAnalyticsOutput } from "../types";

interface PerformanceTabViewProps {
  performance: DashboardAnalyticsOutput["performance"];
  courseId: string;
  versionLabel: string | null;
  latestVersionLabel: string | null;
  t: CoursesTranslations;
}

export function PerformanceTabView({
  performance,
  courseId,
  versionLabel,
  latestVersionLabel,
  t,
}: PerformanceTabViewProps) {
  const perfT = t.detail.analyticsTab;

  const getViewingText = () => {
    if (versionLabel) {
      return perfT.performanceViewingVer.replace("{{version}}", versionLabel);
    }
    if (latestVersionLabel) {
      return perfT.performanceViewingVerLatest.replace(
        "{{version}}",
        latestVersionLabel,
      );
    }
    return perfT.performanceViewingLatestFallback;
  };

  return (
    <div className={cn(cardClass, "animate-in fade-in p-5 duration-200")}>
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-ink text-[14px] font-semibold">
            {perfT.performanceTitle}
          </h3>
          <p className="text-ink-soft text-[12px]">{perfT.performanceSub}</p>
        </div>
        <div className="border-edge text-ink-muted flex shrink-0 items-center gap-1.5 self-start rounded-full border-2 bg-white px-3 py-1 text-[11px] font-semibold shadow-[0_2px_0_0_var(--color-lip)] sm:self-center">
          <GitBranch className="text-ink-faint h-3.5 w-3.5" />
          <span>{getViewingText()}</span>
        </div>
      </div>
      <LessonPerformanceView data={performance} courseId={courseId} t={t} />
    </div>
  );
}
