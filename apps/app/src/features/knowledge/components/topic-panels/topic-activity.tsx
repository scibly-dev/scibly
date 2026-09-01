"use client";

import type { KnowledgeTranslations } from "../../contracts";
import type { Bundle, Run, TopicView } from "./contracts";

import { useLocale } from "@scibly/i18n/react";
import {
  CircleSlash,
  Clock3,
  Filter,
  Hourglass,
  Loader2,
  Minus,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { outcomeLabels } from "./contracts";
import { Empty, Hint } from "./shell";

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
  Bundle["outcome"],
  { icon: typeof Clock3; tone: string; spin?: boolean }
>;

type ActivityEvent =
  | { kind: "run"; key: string; at: Date; run: Run }
  | { kind: "read"; key: string; at: Date; bundle: Bundle };

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
  const labels = outcomeLabels(t);

  const events: ActivityEvent[] = [
    ...runs.map(
      (run): ActivityEvent => ({
        kind: "run",
        key: `run-${run.id}`,
        at: new Date(run.startedAt),
        run,
      }),
    ),
    // A bundle still being read has nothing to report yet.
    ...bundles
      .filter((bundle) => bundle.outcome !== "READING")
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
                : OUTCOME_MARKS[event.bundle.outcome];
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
                      className={`text-[12px] ${event.bundle.outcome === "FAILED" ? "text-destructive" : "text-ink-faint"}`}
                    >
                      {labels[event.bundle.outcome]}
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
