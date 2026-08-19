"use client";

import React, { useState } from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";

import { CompletedTabView } from "./components/completed-tab-view";
import { DashboardSkeleton } from "./components/dashboard-skeleton";
import { FilterBar } from "./components/filter-bar";
import { KpiCell } from "./components/kpi-cell";
import { LearnersTabView } from "./components/learners-tab-view";
import { PerformanceTabView } from "./components/performance-tab-view";
import { ScoreTabView } from "./components/score-tab-view";
import {
  type DashboardAnalyticsOutput,
  type DashboardTab,
  type TimeRange,
} from "./types";
import { formatSeconds } from "./utils/format";

interface CourseAnalyticsDashboardProps {
  courseId: string;
}

interface KpiTabButtonProps {
  activeTab: DashboardTab;
  label: string;
  onSelect: (tab: DashboardTab) => void;
  subtitle: string;
  tab: DashboardTab;
  value: number | string;
}

export function KpiTabButton(props: KpiTabButtonProps) {
  return (
    <button
      onClick={() => props.onSelect(props.tab)}
      className="ease-press group flex flex-col justify-stretch rounded-2xl text-left transition-transform duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 active:translate-y-[3px]"
    >
      <KpiCell
        label={props.label}
        value={props.value}
        subtitle={props.subtitle}
        tab={props.tab}
        isActive={props.activeTab === props.tab}
      />
    </button>
  );
}

interface AnalyticsKpiTabsProps {
  activeTab: DashboardTab;
  data: DashboardAnalyticsOutput;
  onSelect: (tab: DashboardTab) => void;
  t: CoursesTranslations;
}

export function AnalyticsKpiTabs({
  activeTab,
  data,
  onSelect,
  t,
}: AnalyticsKpiTabsProps) {
  const dashboardT = t.detail.analyticsTab;
  const totalLearners = data.kpis.enrolled.total + data.kpis.anonymous.total;
  const totalCompleted =
    data.kpis.enrolled.completed + data.kpis.anonymous.completed;
  const completionRate =
    totalLearners > 0 ? Math.round((totalCompleted / totalLearners) * 100) : 0;
  const completedSubtitle =
    totalLearners > 0
      ? dashboardT.kpiCompletedSubRate.replace(
          "{{rate}}",
          String(completionRate),
        )
      : dashboardT.kpiCompletedSub
          .replace("{{members}}", String(data.kpis.enrolled.completed))
          .replace("{{anon}}", String(data.kpis.anonymous.completed));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiTabButton
        activeTab={activeTab}
        label={dashboardT.kpiLearners}
        onSelect={onSelect}
        subtitle={dashboardT.kpiLearnersSub
          .replace("{{members}}", String(data.kpis.enrolled.total))
          .replace("{{anon}}", String(data.kpis.anonymous.total))}
        tab="learners"
        value={totalLearners}
      />
      <KpiTabButton
        activeTab={activeTab}
        label={dashboardT.kpiCompleted}
        onSelect={onSelect}
        subtitle={completedSubtitle}
        tab="completed"
        value={totalCompleted}
      />
      <KpiTabButton
        activeTab={activeTab}
        label={dashboardT.kpiAvgScore}
        onSelect={onSelect}
        subtitle={dashboardT.kpiAvgScoreSub}
        tab="score"
        value={`${data.kpis.avgScore}%`}
      />
      <KpiTabButton
        activeTab={activeTab}
        label={dashboardT.kpiPerformance}
        onSelect={onSelect}
        subtitle={dashboardT.kpiPerformanceSub}
        tab="performance"
        value={formatSeconds(data.kpis.avgTimeSeconds)}
      />
    </div>
  );
}

interface ActiveTabContentProps {
  activeTab: DashboardTab;
  courseId: string;
  data: DashboardAnalyticsOutput;
  latestVersionLabel: string | null;
  t: CoursesTranslations;
  versionLabel: string | null;
}

export function ActiveTabContent(props: ActiveTabContentProps) {
  if (props.activeTab === "learners") {
    return (
      <LearnersTabView
        enrollmentTrend={props.data.enrollmentTrend}
        trafficSources={props.data.trafficSources}
        t={props.t}
      />
    );
  }
  if (props.activeTab === "completed") {
    return (
      <CompletedTabView
        completion={props.data.completion}
        kpis={props.data.kpis}
        t={props.t}
      />
    );
  }
  if (props.activeTab === "score") {
    return (
      <ScoreTabView
        scoreDistribution={props.data.scoreDistribution}
        avgScore={props.data.kpis.avgScore}
        versionStats={props.data.versionStats}
        t={props.t}
      />
    );
  }
  return (
    <PerformanceTabView
      performance={props.data.performance}
      courseId={props.courseId}
      versionLabel={props.versionLabel}
      latestVersionLabel={props.latestVersionLabel}
      t={props.t}
    />
  );
}

export function CourseAnalyticsDashboard({
  courseId,
}: CourseAnalyticsDashboardProps) {
  const { translations: t } = useTranslation("courses");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [versionId, setVersionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("learners");

  const { data, isLoading } = api.course.getDashboardAnalytics.useQuery(
    { courseId, timeRange, versionId: versionId ?? undefined },
    { staleTime: 30_000 },
  );

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const versionLabel =
    versionId && versionId !== "all"
      ? `v${data.versions.find((v) => v.id === versionId)?.version ?? "?"}`
      : null;

  const latestVersionLabel = data.versions[0]
    ? `v${data.versions[0].version}`
    : null;

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <FilterBar
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        versionId={versionId}
        onVersionIdChange={setVersionId}
        versions={data.versions}
        versionLabel={versionLabel}
        t={t}
      />

      <AnalyticsKpiTabs
        activeTab={activeTab}
        data={data}
        onSelect={setActiveTab}
        t={t}
      />
      <div className="transition-all duration-200">
        <ActiveTabContent
          activeTab={activeTab}
          courseId={courseId}
          data={data}
          latestVersionLabel={latestVersionLabel}
          t={t}
          versionLabel={versionLabel}
        />
      </div>
    </div>
  );
}
