"use client";

import type { KnowledgeTranslations } from "../contracts";

import { useLocale } from "@scibly/i18n/react";
import { Badge } from "@scibly/ui/components/badge";
import {
  CircleSlash,
  Clock3,
  Filter,
  Github,
  Hourglass,
  Loader2,
  Minus,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { type RouterOutputs } from "@/shared/api/trpc/contracts";

type TopicView = RouterOutputs["knowledge"]["get"];
type Source = TopicView["bundles"][number];
type Run = TopicView["runs"][number];
type Insight = TopicView["insights"][number];

// Where a source came from. GitHub is the only collector today; a Slack or
// Linear entry is an icon and a label, which is why rows read from a map
// instead of hard-coding an octocat.
const PROVIDERS = { GITHUB: Github } satisfies Record<
  Source["provider"] | Run["provider"],
  typeof Github
>;

const Hint = ({ children }: { children: string }) => (
  <p className="text-ink-faint text-[12px]">{children}</p>
);

const Empty = ({ children }: { children: string }) => (
  <p className="text-ink-muted py-6 text-center text-[13px]">{children}</p>
);

/** The four numbers that answer "is this document alive?" at a glance. */
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
  const reading = bundles.filter((b) => b.status === "READING").length;
  const stats = [
    { label: t.feed.statInsights, value: String(insights.length) },
    { label: t.feed.statRead, value: String(bundles.length - reading) },
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

/** One claim: the prose, its citations, and how sure the extraction was. */
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

/**
 * The product: what the topic learned, filed under the source it was read
 * from — the source's provider icon and title head the group, the claims hang
 * off it. A claim whose bundle fell out of the feed window (or was deleted)
 * still shows, in a trailing group with only its citations to say where it
 * came from.
 */
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
  const groups = new Map<Source | null, Insight[]>();
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

/**
 * Everything the topic has read and what came of each one. The verdict is the
 * point: a pull request that was judged routine or out of scope is not missing
 * from the page, it is on it, saying so.
 */
export function TopicSources({
  t,
  bundles,
  failed,
}: {
  t: KnowledgeTranslations;
  bundles: TopicView["bundles"];
  failed: TopicView["failed"];
}) {
  const locale = useLocale();
  const outcomes = {
    READING: { label: t.feed.outcomeReading, variant: "secondary" as const },
    EXTRACTED: { label: t.feed.outcomeExtracted, variant: "default" as const },
    NO_INSIGHTS: {
      label: t.feed.outcomeNoInsights,
      variant: "outline" as const,
    },
    LOW_VALUE: { label: t.feed.outcomeLowValue, variant: "outline" as const },
    OFF_TOPIC: { label: t.feed.outcomeOffTopic, variant: "outline" as const },
    UNFUNDED: { label: t.feed.outcomeUnfunded, variant: "outline" as const },
    FAILED: { label: t.feed.outcomeFailed, variant: "destructive" as const },
  } satisfies Record<Source["status"], { label: string; variant: string }>;

  // What is still moving belongs at the top; the rest stays newest-first.
  const sorted = [...bundles].sort(
    (a, b) => Number(b.status === "READING") - Number(a.status === "READING"),
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
            const outcome = outcomes[bundle.status];
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
                <Badge variant={outcome.variant} className="shrink-0 gap-1">
                  {bundle.status === "READING" ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  ) : null}
                  {outcome.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** How a timeline entry draws itself: the mark on the rail and its tone. */
const RUN_MARKS = {
  QUEUED: { icon: Clock3, tone: "text-ink-faint" },
  RUNNING: { icon: Loader2, tone: "text-ink-muted", spin: true },
  SUCCEEDED: { icon: RefreshCw, tone: "text-ink-muted" },
  FAILED: { icon: TriangleAlert, tone: "text-destructive" },
} satisfies Record<
  Run["status"],
  { icon: typeof Clock3; tone: string; spin?: boolean }
>;

const OUTCOME_MARKS = {
  READING: { icon: Loader2, tone: "text-ink-muted", spin: true },
  EXTRACTED: { icon: Sparkles, tone: "text-ink" },
  NO_INSIGHTS: { icon: CircleSlash, tone: "text-ink-faint" },
  LOW_VALUE: { icon: Minus, tone: "text-ink-faint" },
  OFF_TOPIC: { icon: Filter, tone: "text-ink-faint" },
  UNFUNDED: { icon: Hourglass, tone: "text-ink-faint" },
  FAILED: { icon: TriangleAlert, tone: "text-destructive" },
} satisfies Record<
  Source["status"],
  { icon: typeof Clock3; tone: string; spin?: boolean }
>;

type ActivityEvent =
  | { kind: "run"; key: string; at: Date; run: Run }
  | { kind: "read"; key: string; at: Date; bundle: Source };

/**
 * One timeline for every step the sync took: each collection run, and each
 * bundle the funnel settled — triage refusing it, extraction reading it, or a
 * failure holding it. All of it is read off rows the funnel already writes, so
 * nothing here needs its own log.
 */
export function TopicActivity({
  t,
  runs,
  bundles,
}: {
  t: KnowledgeTranslations;
  runs: TopicView["runs"];
  bundles: TopicView["bundles"];
}) {
  const locale = useLocale();
  const statusLabels = {
    QUEUED: t.feed.queued,
    RUNNING: t.feed.running,
    SUCCEEDED: t.feed.succeeded,
    FAILED: t.feed.failed,
  } satisfies Record<Run["status"], string>;
  const outcomeLabels = {
    READING: t.feed.outcomeReading,
    EXTRACTED: t.feed.outcomeExtracted,
    NO_INSIGHTS: t.feed.outcomeNoInsights,
    LOW_VALUE: t.feed.outcomeLowValue,
    OFF_TOPIC: t.feed.outcomeOffTopic,
    UNFUNDED: t.feed.outcomeUnfunded,
    FAILED: t.feed.outcomeFailed,
  } satisfies Record<Source["status"], string>;

  const events: ActivityEvent[] = [
    ...runs.map(
      (run): ActivityEvent => ({
        kind: "run",
        key: `run-${run.id}`,
        at: new Date(run.startedAt),
        run,
      }),
    ),
    // A bundle still being read has no verdict to report yet; the spinner in
    // the sources list and the "being read" stat carry that state.
    ...bundles
      .filter((bundle) => bundle.status !== "READING")
      .map(
        (bundle): ActivityEvent => ({
          kind: "read",
          key: `read-${bundle.id}`,
          at: new Date(bundle.processedAt ?? bundle.collectedAt),
          bundle,
        }),
      ),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const when = (at: Date) =>
    at.toLocaleString(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Hint>{t.feed.activityHint}</Hint>
      {events.length === 0 ? (
        <Empty>{t.feed.empty}</Empty>
      ) : (
        <ol className="flex flex-col">
          {events.map((event, index) => {
            const mark =
              event.kind === "run"
                ? RUN_MARKS[event.run.status]
                : OUTCOME_MARKS[event.bundle.status];
            const Icon = mark.icon;
            return (
              <li
                key={event.key}
                className="relative flex gap-3 pb-4 last:pb-0"
              >
                {index < events.length - 1 ? (
                  <span
                    className="bg-hairline absolute top-7 bottom-0 left-[13px] w-px"
                    aria-hidden
                  />
                ) : null}
                <span className="border-hairline bg-ground-soft z-10 mt-0.5 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border">
                  <Icon
                    className={`h-3.5 w-3.5 ${mark.tone} ${"spin" in mark && mark.spin ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-[13px]">
                  <div className="flex items-baseline justify-between gap-2">
                    {event.kind === "run" ? (
                      <span className="text-ink truncate font-medium">
                        {t.feed.collectedEvent.replace(
                          "{repository}",
                          event.run.repository,
                        )}
                      </span>
                    ) : (
                      <a
                        href={event.bundle.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink hover:text-ink-muted truncate font-medium underline-offset-2 hover:underline"
                      >
                        #{event.bundle.number} {event.bundle.title}
                      </a>
                    )}
                    <time className="text-ink-faint shrink-0 text-[11px] tabular-nums">
                      {when(event.at)}
                    </time>
                  </div>
                  {event.kind === "run" ? (
                    <>
                      <span className="text-ink-faint text-[12px]">
                        {event.run.status === "SUCCEEDED"
                          ? t.feed.counts
                              .replace(
                                "{collected}",
                                String(event.run.collected),
                              )
                              .replace(
                                "{discarded}",
                                String(event.run.discarded),
                              ) +
                            (event.run.capped ? ` · ${t.feed.capped}` : "")
                          : statusLabels[event.run.status]}
                      </span>
                      {event.run.failureReason ? (
                        <span className="text-destructive text-[12px]">
                          {event.run.failureReason}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span
                      className={`text-[12px] ${event.bundle.status === "FAILED" ? "text-destructive" : "text-ink-faint"}`}
                    >
                      {outcomeLabels[event.bundle.status]}
                      {event.bundle.insightCount > 0
                        ? ` · ${t.feed.insightsFrom.replace("{count}", String(event.bundle.insightCount))}`
                        : ""}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
