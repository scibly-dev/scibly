"use client";

import type { KnowledgeTranslations } from "../../contracts";
import type { Bundle, TopicView } from "./contracts";

import { useLocale } from "@scibly/i18n/react";
import { Badge } from "@scibly/ui/components/badge";
import { Loader2 } from "lucide-react";

import { outcomeLabels, PROVIDERS } from "./contracts";
import { Empty, Hint } from "./shell";

const VARIANTS = {
  READING: "secondary",
  EXTRACTED: "default",
  NO_INSIGHTS: "outline",
  LOW_VALUE: "outline",
  OFF_TOPIC: "outline",
  UNFUNDED: "outline",
  FAILED: "destructive",
} satisfies Record<
  Bundle["outcome"],
  "secondary" | "default" | "outline" | "destructive"
>;

export function TopicBundleList({
  t,
  bundles,
  failed,
}: {
  t: KnowledgeTranslations;
  bundles: TopicView["bundles"];
  failed: TopicView["failed"];
}) {
  const locale = useLocale();
  const labels = outcomeLabels(t);

  // What is still moving belongs at the top; the rest stays newest-first.
  const sorted = [...bundles].sort(
    (a, b) => Number(b.outcome === "READING") - Number(a.outcome === "READING"),
  );

  return (
    <div className="flex flex-col gap-3">
      <Hint>{t.feed.sourcesHint}</Hint>
      {failed.count > 0 ? (
        <p className="text-destructive text-[13px]">
          {t.feed.readFailed.replace("{count}", String(failed.count))}
          {failed.reason ? ` — ${failed.reason}` : ""}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <Empty>{t.feed.noSources}</Empty>
      ) : (
        <ul className="divide-hairline divide-y">
          {sorted.map((bundle) => {
            const Icon = PROVIDERS[bundle.provider];
            return (
              <li
                key={bundle.id}
                className="hover:bg-ground-soft -mx-2 flex items-start gap-3 rounded-md px-2 py-3 transition-colors"
              >
                <Icon
                  className="text-ink-faint mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <a
                    href={bundle.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink hover:text-ink-muted truncate text-[13px] font-medium underline-offset-2 hover:underline"
                  >
                    #{bundle.number} {bundle.title}
                  </a>
                  <span className="text-ink-faint truncate text-[12px]">
                    {bundle.repository}
                    {" · "}
                    {new Date(bundle.collectedAt).toLocaleDateString(locale)}
                    {bundle.insightCount > 0
                      ? ` · ${t.feed.insightsFrom.replace("{count}", String(bundle.insightCount))}`
                      : ""}
                    {bundle.truncated ? ` · ${t.feed.truncated}` : ""}
                  </span>
                </div>
                <Badge
                  variant={VARIANTS[bundle.outcome]}
                  className="shrink-0 gap-1"
                >
                  {bundle.outcome === "READING" ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  ) : null}
                  {labels[bundle.outcome]}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
