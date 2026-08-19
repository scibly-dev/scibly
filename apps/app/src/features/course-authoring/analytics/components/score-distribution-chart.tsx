"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@scibly/ui/components/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

interface ScoreDistributionChartProps {
  data: Array<{ range: string; count: number }>;
  avgScore?: number;
  t: CoursesTranslations;
}

// Map avgScore (0-100) to the x-axis category label
function avgScoreToLabel(avgScore: number): string {
  const SCORE_BINS = ["0–20%", "20–40%", "40–60%", "60–80%", "80–100%"];
  const bucket = Math.min(Math.floor(avgScore / 20), 4);
  return SCORE_BINS[bucket] ?? "0–20%";
}

export function ScoreGradient() {
  return (
    <defs>
      <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.9} />
        <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.4} />
      </linearGradient>
    </defs>
  );
}

export function ScoreDistributionChart({
  data,
  avgScore,
  t,
}: ScoreDistributionChartProps) {
  const scoreT = t.detail.analyticsTab;

  const chartConfig = {
    count: { label: scoreT.kpiLearners, color: "#8b6bf5" },
  } satisfies ChartConfig;

  const hasData = data.some((d) => d.count > 0);
  const showRef = hasData && avgScore !== undefined && avgScore > 0;

  if (!hasData) {
    return (
      <div className="text-ink-soft flex h-[140px] items-center justify-center text-[13px]">
        {scoreT.scoreNoData}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[160px] w-full"
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
        >
          <ScoreGradient />
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={24}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="url(#fillScore)" radius={[4, 4, 0, 0]} />
          {showRef && (
            <ReferenceLine
              x={avgScoreToLabel(avgScore!)}
              stroke="#e0a800"
              strokeWidth={2}
              strokeDasharray="4 3"
              label={{
                value: scoreT.scoreAvgLabel.replace(
                  "{{score}}",
                  String(avgScore),
                ),
                position: "top",
                fontSize: 10,
                fill: "#b87f02",
                fontWeight: 600,
                offset: 6,
              }}
            />
          )}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
