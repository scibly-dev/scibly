import type { KnowledgeTranslations, TopicLanguage } from "./contracts";

import { hasAppErrorCode } from "@scibly/api/application-error";
import { getLocale } from "@scibly/i18n";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { getFullDictionary } from "@/i18n/dictionaries";
import { api, HydrateClient } from "@/shared/api/trpc/server";

import { TopicDetailClient } from "./components/topic-detail-client";
import { TopicsSkeleton } from "./components/topics-skeleton";

async function Topic({
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
  // Dehydrating the topic reads the clock, so this subtree is explicitly the streamed one rather than part of the shell.
  await connection();
  try {
    await api.knowledge.get.prefetch({ orgSlug, topicId });
  } catch (error) {
    if (hasAppErrorCode(error, "NOT_FOUND", "FORBIDDEN")) notFound();
    throw error;
  }

  return (
    <HydrateClient>
      <TopicDetailClient
        t={t}
        orgSlug={orgSlug}
        topicId={topicId}
        defaultLanguage={defaultLanguage}
      />
    </HydrateClient>
  );
}

export async function KnowledgeTopicScreen(props: {
  params: Promise<{ lang: string; orgSlug: string; topicId: string }>;
}) {
  const { lang, orgSlug, topicId } = await props.params;
  const t = (await getFullDictionary(lang)).knowledge;

  return (
    <div className="flex w-full flex-col gap-8 pb-20">
      <Suspense fallback={<TopicsSkeleton />}>
        <Topic
          t={t}
          orgSlug={orgSlug}
          topicId={topicId}
          defaultLanguage={getLocale(lang, true)}
        />
      </Suspense>
    </div>
  );
}
