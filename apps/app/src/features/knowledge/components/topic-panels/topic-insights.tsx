"use client";

import type { KnowledgeTranslations } from "../../contracts";
import type { Bundle, Insight, TopicView } from "./contracts";

import { useLocale } from "@scibly/i18n/react";

import { PROVIDERS } from "./contracts";
import { Empty, Hint } from "./shell";

const InsightRow = ({
  t,
  insight,
}: {
  t: KnowledgeTranslations;
  insight: Insight;
}) => (
  <li className="flex flex-col gap-1.5 py-3.5">
    <p className="text-ink max-w-prose text-[13px] leading-relaxed">
      {insight.claim}
    </p>
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
      {insight.citations.map((citation) => (
        <a
          key={citation.url}
          href={citation.url}
          target="_blank"
          rel="noreferrer"
          className="text-ink-muted hover:text-ink truncate underline underline-offset-2"
        >
          {citation.label || citation.url}
        </a>
      ))}
      <span className="text-ink-faint">
        {t.feed.confidence.replace("{confidence}", String(insight.confidence))}
      </span>
    </p>
  </li>
);

/** A claim whose bundle fell out of the feed window still shows, in a trailing group. */
export function TopicInsights({
  t,
  insights,
  bundles,
}: {
  t: KnowledgeTranslations;
  insights: TopicView["insights"];
  bundles: TopicView["bundles"];
}) {
  const locale = useLocale();
  if (insights.length === 0) return <Empty>{t.feed.noInsights}</Empty>;

  const bundleById = new Map(bundles.map((bundle) => [bundle.id, bundle]));
  const groups = new Map<Bundle | null, Insight[]>();
  for (const insight of insights) {
    const bundle =
      (insight.bundleId && bundleById.get(insight.bundleId)) || null;
    groups.set(bundle, [...(groups.get(bundle) ?? []), insight]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Hint>{t.feed.insightsHint}</Hint>
      {[...groups.entries()].map(([bundle, claims]) => {
        const Icon = bundle ? PROVIDERS[bundle.provider] : null;
        return (
          <section
            key={bundle?.id ?? "orphaned"}
            className="flex flex-col gap-1"
          >
            {bundle && Icon ? (
              <header className="flex items-baseline gap-2">
                <Icon
                  className="text-ink-muted h-4 w-4 shrink-0 self-center"
                  aria-hidden
                />
                <a
                  href={bundle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink hover:text-ink-muted min-w-0 truncate text-[13px] font-semibold underline-offset-2 hover:underline"
                >
                  #{bundle.number} {bundle.title}
                </a>
                <span className="text-ink-faint shrink-0 text-[12px]">
                  {bundle.repository}
                  {" · "}
                  {new Date(bundle.collectedAt).toLocaleDateString(locale)}
                </span>
              </header>
            ) : null}
            <ul className="border-hairline divide-hairline ml-2 divide-y border-l pl-4">
              {claims.map((insight) => (
                <InsightRow key={insight.id} t={t} insight={insight} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
