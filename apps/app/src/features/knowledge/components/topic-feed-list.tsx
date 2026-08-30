"use client";

import type { KnowledgeTranslations } from "../contracts";

import { useLocale } from "@scibly/i18n/react";
import { Badge } from "@scibly/ui/components/badge";
import { Card, CardContent } from "@scibly/ui/components/card";

import { type RouterOutputs } from "@/shared/api/trpc/contracts";

type TopicView = RouterOutputs["knowledge"]["get"];

export function TopicFeed({
  t,
  runs,
  bundles,
}: {
  t: KnowledgeTranslations;
  runs: TopicView["runs"];
  bundles: TopicView["bundles"];
}) {
  // The route's locale, not the browser's: the server rendered this list first.
  const locale = useLocale();
  const statusLabels = {
    QUEUED: t.feed.queued,
    RUNNING: t.feed.running,
    SUCCEEDED: t.feed.succeeded,
    FAILED: t.feed.failed,
  } satisfies Record<TopicView["runs"][number]["status"], string>;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        <h2 className="text-ink text-base font-semibold">{t.feed.title}</h2>

        {runs.length === 0 ? (
          <p className="text-ink-muted text-[13px]">{t.feed.empty}</p>
        ) : (
          <ul className="divide-edge divide-y text-[13px]">
            {runs.map((run) => (
              <li key={run.id} className="flex flex-wrap gap-2 py-2">
                <Badge variant="outline">{statusLabels[run.status]}</Badge>
                <span className="text-ink truncate">{run.repository}</span>
                <span className="text-ink-muted">
                  {t.feed.counts
                    .replace("{collected}", String(run.collected))
                    .replace("{discarded}", String(run.discarded))}
                  {run.capped ? ` · ${t.feed.capped}` : ""}
                </span>
                <time className="text-ink-faint ml-auto">
                  {new Date(run.startedAt).toLocaleString(locale)}
                </time>
                {run.failureReason ? (
                  <p className="text-destructive w-full">{run.failureReason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-ink text-sm font-medium">{t.feed.bundles}</h3>
          {bundles.length === 0 ? (
            <p className="text-ink-muted text-[13px]">{t.feed.noBundles}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-[13px]">
              {bundles.map((bundle) => (
                <li key={bundle.id} className="flex gap-2">
                  <a
                    href={bundle.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink hover:text-ink-muted truncate underline underline-offset-2"
                  >
                    #{bundle.number} {bundle.title}
                  </a>
                  <span className="text-ink-faint shrink-0">
                    {bundle.repository}
                    {bundle.truncated ? ` · ${t.feed.truncated}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
