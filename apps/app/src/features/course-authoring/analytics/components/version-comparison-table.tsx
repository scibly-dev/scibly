"use client";

import { useLocale } from "@scibly/i18n/react";
import { cn } from "@scibly/ui/utils";
import { GitBranch } from "lucide-react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

interface VersionStat {
  id: string;
  version: number;
  publishedAt: Date;
  enrolled: number;
  anonSessions: number;
  anonCompleted: number;
  avgScore: number;
}

interface VersionComparisonTableProps {
  versions: VersionStat[];
  t: CoursesTranslations;
}

function getAvgScoreClassName(score: number): string {
  if (score >= 80) {
    return "text-emerald-600";
  }
  if (score >= 60) {
    return "text-amber-600";
  }
  if (score > 0) {
    return "text-red-500";
  }
  return "text-ink-soft";
}

export function VersionRow({
  isLatest,
  locale,
  t,
  version,
}: {
  isLatest: boolean;
  locale: string;
  t: CoursesTranslations;
  version: VersionStat;
}) {
  const tableT = t.detail.analyticsTab;
  const completionRate =
    version.anonSessions > 0
      ? Math.round((version.anonCompleted / version.anonSessions) * 100)
      : 0;
  return (
    <div className="grid grid-cols-[auto_1fr_80px_80px_70px_80px] items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-left">
      <GitBranch className="text-ink-soft/50 h-3.5 w-3.5 shrink-0" />
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-ink text-[13px] font-semibold">
          v{version.version}
        </span>
        {isLatest && (
          <span className="rounded-full border-2 border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            {tableT.filterVersionLatest}
          </span>
        )}
        <span className="text-ink-soft text-[11px]">
          {new Date(version.publishedAt).toLocaleDateString(locale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
      <span className="text-right text-[13px] font-semibold tabular-nums">
        {version.enrolled > 0 ? (
          version.enrolled
        ) : (
          <span className="text-ink-soft">—</span>
        )}
      </span>
      <span className="text-ink-soft text-right text-[13px] tabular-nums">
        {version.anonSessions > 0 ? version.anonSessions : "—"}
      </span>
      <div className="flex flex-col items-end gap-0.5">
        {version.anonSessions > 0 ? (
          <>
            <span className="text-[12px] font-semibold tabular-nums">
              {completionRate}%
            </span>
            <div className="bg-edge h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </>
        ) : (
          <span className="text-ink-soft text-[12px]">—</span>
        )}
      </div>
      <span
        className={cn(
          "text-right text-[13px] font-semibold tabular-nums",
          getAvgScoreClassName(version.avgScore),
        )}
      >
        {version.avgScore > 0 ? `${version.avgScore}%` : "—"}
      </span>
    </div>
  );
}

export function VersionComparisonTable({
  versions,
  t,
}: VersionComparisonTableProps) {
  const locale = useLocale();
  const tableT = t.detail.analyticsTab;

  if (versions.length === 0) {
    return (
      <div className="text-ink-soft flex h-[80px] items-center justify-center text-[13px]">
        {tableT.versionNoData}
      </div>
    );
  }

  const latestId = versions[0]?.id;

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="text-ink-soft grid grid-cols-[auto_1fr_80px_80px_70px_80px] gap-3 px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase">
        <span className="w-4" />
        <span>{tableT.versionTitle}</span>
        <span className="text-right">{tableT.trendEnrolled}</span>
        <span className="text-right">
          {tableT.trendAnonymous === "Anonymous" ? "Anon" : "Anonym"}
        </span>
        <span className="text-right">{tableT.kpiCompleted}</span>
        <span className="text-right">{tableT.kpiAvgScore}</span>
      </div>

      {versions.map((version) => (
        <VersionRow
          key={version.id}
          isLatest={version.id === latestId}
          locale={locale}
          t={t}
          version={version}
        />
      ))}
    </div>
  );
}
