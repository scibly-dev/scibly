import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Code, Globe, HelpCircle, Link2 } from "lucide-react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import {
  type TrafficSource,
  type TrafficSourceKind,
} from "../server/traffic-sources";

interface TrafficSourcesPanelProps {
  sources: TrafficSource[];
  t: CoursesTranslations;
}

const KIND_ICONS = {
  origin: Globe,
  "embed-hidden": Code,
  direct: Link2,
  untracked: HelpCircle,
} satisfies Record<TrafficSourceKind, typeof Globe>;

function labelFor(
  source: TrafficSource,
  t: CoursesTranslations["detail"]["trafficSources"],
) {
  switch (source.kind) {
    case "origin":
      return source.origin ?? t.embedHidden;
    case "embed-hidden":
      return t.embedHidden;
    case "direct":
      return t.direct;
    case "untracked":
      return t.untracked;
  }
}

const headCellClass = "text-ink-soft pb-2 text-[11px] font-semibold";

export function TrafficSourcesPanel({ sources, t }: TrafficSourcesPanelProps) {
  const panelT = t.detail.trafficSources;
  const totalSessions = sources.reduce((sum, s) => sum + s.sessions, 0);

  return (
    <div className={cn(cardClass, "p-5")}>
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-ink text-[14px] font-semibold">{panelT.title}</h3>
        <p className="text-ink-soft text-[12px]">{panelT.subtitle}</p>
      </div>

      {sources.length === 0 ? (
        <p className="text-ink-soft py-6 text-center text-[13px]">
          {panelT.empty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <thead>
              <tr className="border-hairline border-b">
                <th className={headCellClass}>{panelT.columnSource}</th>
                <th className={cn(headCellClass, "text-right")}>
                  {panelT.columnSessions}
                </th>
                <th className={cn(headCellClass, "text-right")}>
                  {panelT.columnCompletions}
                </th>
                <th className={cn(headCellClass, "text-right")}>
                  {panelT.columnCompletionRate}
                </th>
                <th className={cn(headCellClass, "text-right")}>
                  {panelT.columnAvgScore}
                </th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const Icon = KIND_ICONS[source.kind];
                const share = totalSessions
                  ? (source.sessions / totalSessions) * 100
                  : 0;
                return (
                  <tr
                    key={source.key}
                    className="border-hairline border-b last:border-0"
                  >
                    <td className="max-w-[280px] py-3 pr-6">
                      <span className="flex items-center gap-2">
                        <span className="border-hairline bg-ground-soft flex size-6 shrink-0 items-center justify-center rounded-lg border">
                          <Icon className="text-ink-soft size-3.5" />
                        </span>
                        <span className="text-ink truncate font-medium">
                          {labelFor(source, panelT)}
                        </span>
                      </span>
                      <span className="bg-lip mt-2 ml-8 block h-1.5 overflow-hidden rounded-full">
                        <span
                          className="block h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.max(share, 2)}%` }}
                        />
                      </span>
                    </td>
                    <td className="text-ink py-3 pl-3 text-right align-top font-semibold tabular-nums">
                      {source.sessions}
                    </td>
                    <td className="text-ink-soft py-3 pl-3 text-right align-top tabular-nums">
                      {source.completions}
                    </td>
                    <td className="text-ink-soft py-3 pl-3 text-right align-top tabular-nums">
                      {source.completionRate}%
                    </td>
                    <td className="text-ink-soft py-3 pl-3 text-right align-top tabular-nums">
                      {source.averageScore === null
                        ? panelT.noScore
                        : `${source.averageScore}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
