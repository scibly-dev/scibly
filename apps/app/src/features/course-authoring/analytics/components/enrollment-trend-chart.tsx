"use client";

import { useLocale } from "@scibly/i18n/react";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@scibly/ui/components/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

interface EnrollmentTrendChartProps {
  data: Array<{ date: string; enrolled: number; anonymous: number }>;
  t: CoursesTranslations;
}

export function EnrollmentTrendGradients() {
  return (
    <defs>
      <linearGradient id="fillEnrolled" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="var(--color-enrolled)" stopOpacity={0.3} />
        <stop
          offset="95%"
          stopColor="var(--color-enrolled)"
          stopOpacity={0.02}
        />
      </linearGradient>
      <linearGradient id="fillAnonymous" x1="0" y1="0" x2="0" y2="1">
        <stop
          offset="5%"
          stopColor="var(--color-anonymous)"
          stopOpacity={0.3}
        />
        <stop
          offset="95%"
          stopColor="var(--color-anonymous)"
          stopOpacity={0.02}
        />
      </linearGradient>
    </defs>
  );
}

function formatShortDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function EnrollmentTrendChart({ data, t }: EnrollmentTrendChartProps) {
  const locale = useLocale();
  const trendT = t.detail.analyticsTab;

  const chartConfig = {
    enrolled: { label: trendT.trendEnrolled, color: "#0066ff" },
    anonymous: { label: trendT.trendAnonymous, color: "#b39dff" },
  } satisfies ChartConfig;

  if (data.length === 0) {
    return (
      <div className="text-ink-soft flex h-[240px] items-center justify-center text-[13px]">
        {trendT.trendNoData}
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[240px] w-full"
    >
      <AreaChart accessibilityLayer data={data}>
        <EnrollmentTrendGradients />
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) => formatShortDate(value, locale)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          allowDecimals={false}
          width={32}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value: string) => formatLongDate(value, locale)}
            />
          }
        />
        <Area
          dataKey="enrolled"
          type="monotone"
          fill="url(#fillEnrolled)"
          stroke="var(--color-enrolled)"
          strokeWidth={2}
          stackId="a"
        />
        <Area
          dataKey="anonymous"
          type="monotone"
          fill="url(#fillAnonymous)"
          stroke="var(--color-anonymous)"
          strokeWidth={2}
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}
