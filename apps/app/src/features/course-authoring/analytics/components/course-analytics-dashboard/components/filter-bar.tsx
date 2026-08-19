import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { Calendar, GitBranch } from "lucide-react";
import React from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import {
  type DashboardAnalyticsOutput,
  TIME_RANGE_OPTIONS,
  type TimeRange,
} from "../types";

interface FilterBarProps {
  timeRange: TimeRange;
  onTimeRangeChange: (v: TimeRange) => void;
  versionId: string | null;
  onVersionIdChange: (v: string | null) => void;
  versions: DashboardAnalyticsOutput["versions"];
  versionLabel: string | null;
  t: CoursesTranslations;
}

export function FilterBar({
  timeRange,
  onTimeRangeChange,
  versionId,
  onVersionIdChange,
  versions,
  versionLabel,
  t,
}: FilterBarProps) {
  const filterT = t.detail.analyticsTab;

  const timeRangeLabels = {
    "7d": filterT.timeRange7d,
    "30d": filterT.timeRange30d,
    "90d": filterT.timeRange90d,
    all: filterT.timeRangeAll,
  } satisfies Record<TimeRange, string>;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={timeRange}
        onValueChange={(v) =>
          onTimeRangeChange(
            TIME_RANGE_OPTIONS.find((opt) => opt.value === v)?.value ??
              timeRange,
          )
        }
      >
        <SelectTrigger className="w-[160px]">
          <Calendar className="text-ink-soft mr-1.5 h-3.5 w-3.5" />
          <SelectValue placeholder={timeRangeLabels[timeRange]} />
        </SelectTrigger>
        <SelectContent>
          {TIME_RANGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {timeRangeLabels[opt.value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Version filter — only shown when more than 1 version exists */}
      {versions.length > 1 && (
        <Select
          value={versionId ?? versions[0]?.id ?? "all"}
          onValueChange={(v) => onVersionIdChange(v)}
        >
          <SelectTrigger className="w-[150px]">
            <GitBranch className="text-ink-soft mr-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filterT.filterAllVersions}</SelectItem>
            {versions.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                v{v.version}
                {v.id === versions[0]?.id
                  ? ` (${filterT.filterVersionLatest})`
                  : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Active filter pills */}
      {versionLabel && (
        <span className="flex items-center gap-1.5 rounded-full border-2 border-blue-300 bg-blue-100 px-3 py-1 text-[12px] font-semibold text-blue-800 shadow-[0_2px_0_0_var(--color-blue-200)]">
          <GitBranch className="h-3.5 w-3.5" />
          {versionLabel}
          <button
            onClick={() => onVersionIdChange(null)}
            className="ml-0.5 font-bold hover:text-blue-950"
            aria-label={filterT.clearFilter}
          >
            ×
          </button>
        </span>
      )}
    </div>
  );
}
