import type { KnowledgeTranslations, TopicLanguage } from "./contracts";

import { getLocale } from "@scibly/i18n";
import { Skeleton } from "@scibly/ui/components/skeleton";
import { connection } from "next/server";
import { Suspense } from "react";

import { getFullDictionary } from "@/i18n/dictionaries";
import { api, HydrateClient } from "@/shared/api/trpc/server";

import { KnowledgeTopicsClient } from "./components/knowledge-topics-client";

function TopicsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <Skeleton className="h-10 w-36 rounded-xl" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-36 w-full rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

async function Topics({
  t,
  orgSlug,
  defaultLanguage,
}: {
  t: KnowledgeTranslations;
  orgSlug: string;
  defaultLanguage: TopicLanguage;
}) {
  // The topic list is per-request, and dehydrating it reads the clock, so this
  // subtree is explicitly the streamed one rather than part of the shell.
  await connection();
  await api.knowledge.list.prefetch({ orgSlug });

  return (
    <HydrateClient>
      <KnowledgeTopicsClient
        t={t}
        orgSlug={orgSlug}
        defaultLanguage={defaultLanguage}
      />
    </HydrateClient>
  );
}

export async function KnowledgeTopicsScreen(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  const { lang, orgSlug } = await props.params;
  const t = (await getFullDictionary(lang)).knowledge;

  return (
    <div className="flex w-full flex-col gap-8 pb-20">
      <div>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {t.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-[15px]">{t.subtitle}</p>
      </div>
      <Suspense fallback={<TopicsSkeleton />}>
        <Topics
          t={t}
          orgSlug={orgSlug}
          // The organization has no locale of its own, so a new topic starts in
          // the language the admin is reading the app in.
          defaultLanguage={getLocale(lang, true)}
        />
      </Suspense>
    </div>
  );
}
