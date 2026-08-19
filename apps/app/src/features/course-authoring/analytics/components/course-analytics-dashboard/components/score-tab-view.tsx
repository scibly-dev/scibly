import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import React from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { ScoreDistributionChart } from "../../score-distribution-chart";
import { VersionComparisonTable } from "../../version-comparison-table";
import { type DashboardAnalyticsOutput } from "../types";

interface ScoreTabViewProps {
  scoreDistribution: DashboardAnalyticsOutput["scoreDistribution"];
  avgScore: number;
  versionStats: DashboardAnalyticsOutput["versionStats"];
  t: CoursesTranslations;
}

export function ScoreTabView({
  scoreDistribution,
  avgScore,
  versionStats,
  t,
}: ScoreTabViewProps) {
  const scoreT = t.detail.analyticsTab;

  return (
    <div className="animate-in fade-in space-y-6 duration-200">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className={cn(cardClass, "p-5 md:col-span-2")}>
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-ink text-[14px] font-semibold">
              {scoreT.scoreTitle}
            </h3>
            <p className="text-ink-soft text-[12px]">{scoreT.scoreSub}</p>
          </div>
          <ScoreDistributionChart
            data={scoreDistribution}
            avgScore={avgScore}
            t={t}
          />
        </div>

        <div
          className={cn(
            cardClass,
            "flex flex-col justify-between p-5 md:col-span-1",
          )}
        >
          <div>
            <h3 className="text-ink mb-1 text-[14px] font-semibold">
              {scoreT.scoreInsights}
            </h3>
            <p className="text-ink-soft mb-4 text-[12px]">
              {scoreT.scoreInsightsSub}
            </p>
          </div>
          <div className="my-auto space-y-4">
            <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-3.5 shadow-[0_2px_0_0_var(--color-purple-200)]">
              <span className="text-ink-soft block text-[11px] tracking-wider uppercase">
                {scoreT.scoreInsightsAvgLabel}
              </span>
              <span className="mt-1 block text-3xl font-bold text-purple-700">
                {avgScore}%
              </span>
            </div>
            <div className="text-ink-soft space-y-2 text-[12px]">
              <p>{scoreT.scoreInsightsAvgDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Version comparison table (only if >1 version) */}
      {versionStats.length > 1 && (
        <div className={cn(cardClass, "p-5")}>
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-ink text-[14px] font-semibold">
              {scoreT.versionTitle}
            </h3>
            <p className="text-ink-soft text-[12px]">{scoreT.versionSub}</p>
          </div>
          <VersionComparisonTable versions={versionStats} t={t} />
        </div>
      )}
    </div>
  );
}
