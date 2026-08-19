"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@scibly/ui/components/chart";
import { Label, Pie, PieChart, type TooltipProps } from "recharts";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

interface CompletionStatusDetail {
  enrolled: number;
  anon: number;
  total: number;
}

interface CompletionDonutChartProps {
  data: {
    completed: CompletionStatusDetail;
    inProgress: CompletionStatusDetail;
    notStarted: CompletionStatusDetail;
  };
  t: CoursesTranslations;
}

type ChartSlice = {
  name: string;
  value: number;
  fill: string;
  enrolled: number;
  anon: number;
};

function buildChartData(
  data: CompletionDonutChartProps["data"],
  t: CoursesTranslations,
): ChartSlice[] {
  const statusBadgeT = t.detail.statusBadge;
  const total =
    data.completed.total + data.inProgress.total + data.notStarted.total;
  if (total === 0) {
    return [
      {
        name: t.detail.analyticsTab.scoreNoData,
        value: 100,
        fill: "var(--color-noData)",
        enrolled: 0,
        anon: 0,
      },
    ];
  }

  return [
    {
      name: statusBadgeT.completed,
      value: data.completed.total,
      fill: "var(--color-completed)",
      enrolled: data.completed.enrolled,
      anon: data.completed.anon,
    },
    {
      name: statusBadgeT.inProgress,
      value: data.inProgress.total,
      fill: "var(--color-inProgress)",
      enrolled: data.inProgress.enrolled,
      anon: data.inProgress.anon,
    },
    {
      name: statusBadgeT.notStarted,
      value: data.notStarted.total,
      fill: "var(--color-notStarted)",
      enrolled: data.notStarted.enrolled,
      anon: data.notStarted.anon,
    },
  ].filter((item) => item.value > 0);
}

export function CustomTooltip({
  active,
  payload,
  t,
}: TooltipProps<number, string> & { t: CoursesTranslations }) {
  if (active && payload && payload.length) {
    const data: ChartSlice | undefined = payload[0]?.payload;
    const completedT = t.detail.analyticsTab;
    if (!data || data.name === completedT.scoreNoData) return null;

    const totalLabel =
      t.detail.peopleTab.colStatus === "Status" ? "Total" : "Gesamt";

    return (
      <div className="animate-in fade-in border-edge min-w-[150px] space-y-1.5 rounded-xl border-2 bg-white p-2.5 text-[12px] shadow-[0_3px_0_0_var(--color-lip)] duration-100">
        <div className="text-ink border-hairline mb-1 flex items-center gap-1.5 border-b-2 pb-1 font-semibold">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: data.fill }}
          />
          <span>{data.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-semibold">
          <span className="text-ink-soft">{totalLabel}:</span>
          <span className="text-ink">{data.value}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="text-ink-soft">{completedT.breakdownMembers}:</span>
          <span className="text-ink font-semibold">{data.enrolled}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="text-ink-soft">{completedT.breakdownAnon}:</span>
          <span className="text-ink font-semibold">{data.anon}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function CompletionDonutChart({ data, t }: CompletionDonutChartProps) {
  const completedT = t.detail.analyticsTab;
  const statusBadgeT = t.detail.statusBadge;

  const chartConfig = {
    completed: { label: statusBadgeT.completed, color: "#2bbf9f" },
    inProgress: { label: statusBadgeT.inProgress, color: "#66aeff" },
    notStarted: { label: statusBadgeT.notStarted, color: "#dedbd2" },
    noData: { label: completedT.scoreNoData, color: "#f7f6f3" },
  } satisfies ChartConfig;

  const total =
    data.completed.total + data.inProgress.total + data.notStarted.total;
  const hasData = total > 0;

  const chartData = buildChartData(data, t);
  const toPct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const completionPct = toPct(data.completed.total);

  return (
    <div className="flex flex-col gap-3">
      <CompletionPie
        chartConfig={chartConfig}
        chartData={chartData}
        completionPct={completionPct}
        hasData={hasData}
        t={t}
      />
      {hasData && (
        <div className="grid grid-cols-3 gap-1 text-center">
          <LegendItem
            color="bg-emerald-500"
            label={statusBadgeT.completed}
            value={`${toPct(data.completed.total)}%`}
          />
          <LegendItem
            color="bg-sky-400"
            label={statusBadgeT.inProgress}
            value={`${toPct(data.inProgress.total)}%`}
          />
          <LegendItem
            color="bg-edge"
            label={statusBadgeT.notStarted}
            value={`${toPct(data.notStarted.total)}%`}
          />
        </div>
      )}
    </div>
  );
}

interface CompletionPieProps {
  chartConfig: ChartConfig;
  chartData: ReturnType<typeof buildChartData>;
  completionPct: number;
  hasData: boolean;
  t: CoursesTranslations;
}

export function CompletionPie({
  chartConfig,
  chartData,
  completionPct,
  hasData,
  t,
}: CompletionPieProps) {
  const doneLabel =
    t.detail.peopleTab.colStatus === "Status" ? "done" : "fertig";

  return (
    <div className="relative h-[120px] w-full">
      <ChartContainer
        config={chartConfig}
        className="[&_.recharts-pie-label-text]:fill-ink h-full w-full"
      >
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={56}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            stroke="none"
            cornerRadius={3}
          >
            {hasData && (
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null;
                  }
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-ink"
                        style={{ fill: "var(--color-ink)" }}
                        fontSize={18}
                        fontWeight={600}
                      >
                        {completionPct}%
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 16}
                        fontSize={10}
                        className="fill-ink-soft"
                        style={{ fill: "var(--color-ink-soft)" }}
                      >
                        {doneLabel}
                      </tspan>
                    </text>
                  );
                }}
              />
            )}
          </Pie>
          <ChartTooltip content={<CustomTooltip t={t} />} />
        </PieChart>
      </ChartContainer>
      {!hasData && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-ink-soft text-[12px] font-medium">
            {t.detail.analyticsTab.scoreNoData}
          </span>
        </div>
      )}
    </div>
  );
}

export function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-ink-soft text-[11px]">{label}</span>
      </div>
      <span className="text-ink text-[13px] font-semibold">{value}</span>
    </div>
  );
}
