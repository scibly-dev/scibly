"use client";

import type { KnowledgeTranslations, TopicLanguage } from "../contracts";

import { routes } from "@scibly/routes";
import { Badge } from "@scibly/ui/components/badge";
import { Button } from "@scibly/ui/components/button";
import { Card, CardContent } from "@scibly/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@scibly/ui/components/tabs";
import { ArrowLeft, ExternalLink, Github, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

import { KnowledgeGateNotice } from "./knowledge-gate-notice";
import { TopicForm } from "./topic-dialog/topic-form";
import {
  TopicActivity,
  TopicInsights,
  TopicOverview,
  TopicSources,
} from "./topic-panels";

const REFETCH_WHILE_RUNNING_MS = 5_000;

// A run no worker ever picked up stays QUEUED forever, and a bundle whose
// triage exhausted its retries waits for the nightly sweep. Stop polling either
// after long enough to outlast a retry.
const GIVE_UP_ON_PENDING_MS = 15 * 60_000;

const recent = (at: Date | string) =>
  Date.now() - new Date(at).getTime() < GIVE_UP_ON_PENDING_MS;

const TabCount = ({ children }: { children: number }) => (
  <span className="text-ink-faint ml-1.5 text-[11px] tabular-nums">
    {children}
  </span>
);

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
      // Collection finishing is not the funnel finishing: keep polling while a
      // collected pull request still has triage and extraction ahead of it.
      refetchInterval: (query) => {
        const view = query.state.data;
        if (!view) return false;
        const collecting = view.runs.some(
          (run) =>
            (run.status === "QUEUED" || run.status === "RUNNING") &&
            recent(run.startedAt),
        );
        const funnelling =
          view.reading.count > 0 &&
          view.reading.since !== null &&
          recent(view.reading.since);
        return collecting || funnelling ? REFETCH_WHILE_RUNNING_MS : false;
      },
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
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4">
        <Link
          href={routes.app.profile.org(orgSlug).knowledge.root}
          className="text-ink-muted hover:text-ink flex w-fit items-center gap-1 text-[13px] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.detail.back}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-ink text-2xl font-semibold tracking-tight">
                {topic.name}
              </h1>
              <Badge variant="outline">{topic.language.toUpperCase()}</Badge>
              {topic.externallyEditedAt ? (
                <Badge variant="outline" title={t.card.externallyEditedHint}>
                  {t.card.externallyEdited}
                </Badge>
              ) : null}
            </div>
            {topic.description ? (
              <p className="text-ink-muted max-w-prose text-[13px] leading-relaxed">
                {topic.description}
              </p>
            ) : null}
            {/* The scope, where it explains the page rather than sitting in a
                form field on the settings tab. */}
            <ul className="flex flex-wrap items-center gap-1.5">
              {topic.repositories.map((repository) => (
                <li
                  key={repository.id}
                  className="border-edge text-ink-muted flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px]"
                >
                  <Github className="h-3 w-3 shrink-0" aria-hidden />
                  {repository.fullName}
                  {repository.pathGlobs.length > 0 ? (
                    <span className="text-ink-faint">
                      {repository.pathGlobs.join(", ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {topic.documentUrl ? (
              <Button variant="outline" asChild>
                <a href={topic.documentUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {t.card.openDocument}
                </a>
              </Button>
            ) : null}
            {data.canSync && data.access.allowed ? (
              <Button
                onClick={() => syncNow.mutate({ orgSlug, topicId })}
                disabled={syncNow.isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncNow.isPending ? "animate-spin" : ""}`}
                />
                {syncNow.isPending ? t.detail.syncing : t.detail.syncNow}
              </Button>
            ) : null}
          </div>
        </div>

        <TopicOverview
          t={t}
          runs={data.runs}
          bundles={data.bundles}
          insights={data.insights}
        />
      </header>

      <KnowledgeGateNotice t={t} access={data.access} />

      <Tabs defaultValue="insights">
        <TabsList>
          <TabsTrigger value="insights">
            {t.feed.insights}
            <TabCount>{data.insights.length}</TabCount>
          </TabsTrigger>
          <TabsTrigger value="sources">
            {t.feed.sources}
            <TabCount>{data.bundles.length}</TabCount>
          </TabsTrigger>
          <TabsTrigger value="activity">{t.feed.activity}</TabsTrigger>
          {data.canManage && data.access.allowed ? (
            <TabsTrigger value="settings">{t.detail.settings}</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="insights" className="pt-3">
          <TopicInsights
            t={t}
            insights={data.insights}
            bundles={data.bundles}
          />
        </TabsContent>
        <TabsContent value="sources" className="pt-3">
          <TopicSources t={t} bundles={data.bundles} failed={data.failed} />
        </TabsContent>
        <TabsContent value="activity" className="pt-3">
          <TopicActivity t={t} runs={data.runs} bundles={data.bundles} />
        </TabsContent>
        {data.canManage && data.access.allowed ? (
          <TabsContent value="settings" className="max-w-3xl pt-3">
            <TopicForm
              t={t}
              orgSlug={orgSlug}
              orgId={data.organizationId}
              defaultLanguage={defaultLanguage}
              topic={topic}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
