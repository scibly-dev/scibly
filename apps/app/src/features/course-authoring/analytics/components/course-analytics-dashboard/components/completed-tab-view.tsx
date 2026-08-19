import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import React from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { CompletionDonutChart } from "../../completion-donut-chart";
import { type DashboardAnalyticsOutput } from "../types";

interface CompletedTabViewProps {
  completion: DashboardAnalyticsOutput["completion"];
  kpis: DashboardAnalyticsOutput["kpis"];
  t: CoursesTranslations;
}

interface CompletionBreakdownRowProps {
  completed: number;
  label: string;
  percent: number;
  percentTemplate: string;
  subtitle: string;
  total: number;
}

export function CompletionBreakdownRow({
  completed,
  label,
  percent,
  percentTemplate,
  subtitle,
  total,
}: CompletionBreakdownRowProps) {
  return (
    <div className="border-edge bg-ground-soft flex items-center justify-between rounded-2xl border-2 p-4 shadow-[0_2px_0_0_var(--color-lip)]">
      <div>
        <h4 className="text-ink text-[13px] font-semibold">{label}</h4>
        <p className="text-ink-soft mt-0.5 text-[11px]">{subtitle}</p>
      </div>
      <div className="text-right">
        <span className="text-ink text-lg font-bold">
          {completed}
          <span className="text-ink-soft text-[12px] font-normal">
            {" "}
            / {total}
          </span>
        </span>
        <p className="text-ink-soft mt-0.5 text-[11px]">
          {percentTemplate.replace("{{percent}}", String(percent))}
        </p>
      </div>
    </div>
  );
}

export function CompletedTabView({
  completion,
  kpis,
  t,
}: CompletedTabViewProps) {
  const completedT = t.detail.analyticsTab;

  const enrolledPct =
    kpis.enrolled.total > 0
      ? Math.round((kpis.enrolled.completed / kpis.enrolled.total) * 100)
      : 0;

  const anonymousPct =
    kpis.anonymous.total > 0
      ? Math.round((kpis.anonymous.completed / kpis.anonymous.total) * 100)
      : 0;

  return (
    <div className="animate-in fade-in grid grid-cols-1 gap-6 duration-200 md:grid-cols-3">
      {/* Donut Chart Card */}
      <div
        className={cn(
          cardClass,
          "flex flex-col justify-between p-5 md:col-span-1",
        )}
      >
        <div className="mb-3 flex flex-col gap-1">
          <h3 className="text-ink text-[14px] font-semibold">
            {completedT.statusTitle}
          </h3>
          <p className="text-ink-soft text-[12px]">{completedT.statusSub}</p>
        </div>
        <CompletionDonutChart data={completion} t={t} />
      </div>

      {/* Detailed completion stats table/list card */}
      <div
        className={cn(
          cardClass,
          "flex flex-col justify-between p-5 md:col-span-2",
        )}
      >
        <div>
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="text-ink text-[14px] font-semibold">
              {completedT.breakdownTitle}
            </h3>
            <p className="text-ink-soft text-[12px]">
              {completedT.breakdownSub}
            </p>
          </div>
          <div className="space-y-4">
            <CompletionBreakdownRow
              completed={kpis.enrolled.completed}
              label={completedT.breakdownMembers}
              percent={enrolledPct}
              percentTemplate={completedT.breakdownPercent}
              subtitle={completedT.breakdownMembersSub}
              total={kpis.enrolled.total}
            />
            <CompletionBreakdownRow
              completed={kpis.anonymous.completed}
              label={completedT.breakdownAnon}
              percent={anonymousPct}
              percentTemplate={completedT.breakdownPercent}
              subtitle={completedT.breakdownAnonSub}
              total={kpis.anonymous.total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
