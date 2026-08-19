import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import React from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { EnrollmentTrendChart } from "../../enrollment-trend-chart";
import { TrafficSourcesPanel } from "../../traffic-sources-panel";
import { type DashboardAnalyticsOutput } from "../types";

interface LearnersTabViewProps {
  enrollmentTrend: DashboardAnalyticsOutput["enrollmentTrend"];
  trafficSources: DashboardAnalyticsOutput["trafficSources"];
  t: CoursesTranslations;
}

export function LearnersTabView({
  enrollmentTrend,
  trafficSources,
  t,
}: LearnersTabViewProps) {
  const learnersT = t.detail.analyticsTab;

  return (
    <div className="animate-in fade-in space-y-6 duration-200">
      <div className={cn(cardClass, "p-5")}>
        <div className="mb-4 flex flex-col gap-1">
          <h3 className="text-ink text-[14px] font-semibold">
            {learnersT.trendTitle}
          </h3>
          <p className="text-ink-soft text-[12px]">{learnersT.trendSub}</p>
        </div>
        <EnrollmentTrendChart data={enrollmentTrend} t={t} />
      </div>

      <TrafficSourcesPanel sources={trafficSources} t={t} />
    </div>
  );
}
