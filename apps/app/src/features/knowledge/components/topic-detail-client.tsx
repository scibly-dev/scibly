"use client";

import type { KnowledgeTranslations, TopicLanguage } from "../contracts";

import { routes } from "@scibly/routes";
import { Badge } from "@scibly/ui/components/badge";
import { Button } from "@scibly/ui/components/button";
import { Card, CardContent } from "@scibly/ui/components/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

import { KnowledgeGateNotice } from "./knowledge-gate-notice";
import { TopicForm } from "./topic-dialog/topic-form";
import { TopicFeed } from "./topic-feed-list";

const REFETCH_WHILE_RUNNING_MS = 5_000;

// A run no worker ever picked up stays QUEUED forever, so stop polling it after
// long enough to outlast a retry.
const GIVE_UP_ON_PENDING_MS = 15 * 60_000;

export function TopicDetailClient({
  t,
  orgSlug,
  topicId,
  defaultLanguage,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  topicId: string;
  defaultLanguage: TopicLanguage;
}) {
  const utils = api.useUtils();
  const { data, isError } = api.knowledge.get.useQuery(
    { orgSlug, topicId },
    {
      refetchInterval: (query) =>
        query.state.data?.runs.some(
          (run) =>
            (run.status === "QUEUED" || run.status === "RUNNING") &&
            Date.now() - new Date(run.startedAt).getTime() <
              GIVE_UP_ON_PENDING_MS,
        )
          ? REFETCH_WHILE_RUNNING_MS
          : false,
    },
  );

  const syncNow = api.knowledge.syncNow.useMutation({
    onSuccess: ({ queued }) => {
      toast.success(t.detail.syncQueued.replace("{count}", String(queued)));
      void utils.knowledge.get.invalidate({ orgSlug, topicId });
    },
    onError: (error) => toast.error(error.message),
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-ink text-sm font-medium">{t.detail.loadFailed}</p>
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  const { topic } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={routes.app.profile.org(orgSlug).knowledge.root}
            className="text-ink-muted hover:text-ink flex items-center gap-1 text-[13px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.detail.back}
          </Link>
          <h1 className="text-ink ml-2 text-xl font-semibold">{topic.name}</h1>
          <Badge variant="outline">{topic.language.toUpperCase()}</Badge>
          {topic.externallyEditedAt ? (
            <Badge variant="outline" title={t.card.externallyEditedHint}>
              {t.card.externallyEdited}
            </Badge>
          ) : null}
          {topic.documentUrl ? (
            <a
              href={topic.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-ink-muted hover:text-ink text-[13px] underline underline-offset-2"
            >
              {t.card.openDocument}
            </a>
          ) : null}
        </div>
        {data.canSync && data.access.allowed ? (
          <Button
            onClick={() => syncNow.mutate({ orgSlug, topicId })}
            disabled={syncNow.isPending}
          >
            <RefreshCw className="h-4 w-4" />
            {syncNow.isPending ? t.detail.syncing : t.detail.syncNow}
          </Button>
        ) : null}
      </div>

      <KnowledgeGateNotice t={t} access={data.access} />

      <TopicFeed t={t} runs={data.runs} bundles={data.bundles} />

      {data.canManage && data.access.allowed ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <h2 className="text-ink text-base font-semibold">
              {t.detail.settings}
            </h2>
            <TopicForm
              t={t}
              orgSlug={orgSlug}
              orgId={data.organizationId}
              defaultLanguage={defaultLanguage}
              topic={topic}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
