"use client";

import type { KnowledgeTranslations } from "../../contracts";
import type { TopicView } from "./contracts";

import { useLocale } from "@scibly/i18n/react";
import { Loader2 } from "lucide-react";

import { isSettled } from "./contracts";

export function TopicOverview({
  t,
  runs,
  bundles,
  insights,
}: {
  t: KnowledgeTranslations;
  runs: TopicView["runs"];
  bundles: TopicView["bundles"];
  insights: TopicView["insights"];
}) {
  const locale = useLocale();
  const lastRun = runs[0];
  const reading = bundles.filter((b) => b.outcome === "READING").length;
  const stats = [
    { label: t.feed.statInsights, value: String(insights.length) },
    { label: t.feed.statRead, value: String(bundles.filter(isSettled).length) },
    { label: t.feed.statReading, value: String(reading), busy: reading > 0 },
    {
      label: t.feed.statLastSync,
      value: lastRun
        ? new Date(lastRun.startedAt).toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
          })
        : t.feed.statNever,
    },
  ];

  return (
    <div className="border-hairline bg-ground-soft divide-hairline grid grid-cols-2 divide-y rounded-xl border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-ink-faint text-[12px]">{stat.label}</span>
          <span className="text-ink flex items-center gap-1.5 text-lg font-semibold tabular-nums">
            {stat.value}
            {stat.busy ? (
              <Loader2
                className="text-ink-faint h-3.5 w-3.5 animate-spin"
                aria-hidden
              />
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
