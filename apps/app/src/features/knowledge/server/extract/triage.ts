import type { BundleContent } from "../collect/bundle";
import type { ExtractRequest } from "./bundle-lifecycle";

import { db, Prisma } from "@scibly/db";
import { z } from "zod";

import { env } from "@/env";
import {
  assertNotTruncated,
  meteredGenerateText,
} from "@/features/organizations/server";
import { parseJsonReply } from "@/shared/ai/json-reply";

import { parseStoredRepositories, touchesScope } from "../topic-repositories";
import { settleBundles } from "./bundle-lifecycle";
import {
  loadPrompt,
  numberTopics,
  parseBundleContent,
  type PromptTopic,
  renderBundleDigest,
} from "./prompts";
import { FUNNEL } from "./thresholds";

const triageRow = z.object({
  id: z.coerce.number().int(),
  topicIds: z.array(z.coerce.number().int()).catch([]),
  worth: z.coerce.number(),
});

const triageReply = z.object({
  bundles: z.array(triageRow.nullable().catch(null)),
});

type StoredBundle = {
  id: string;
  repositoryId: string;
  filePaths: string[];
  content: unknown;
};

type ReadableBundle = {
  id: string;
  content: BundleContent;
  topicIds: string[];
};

export function narrowByScope(bundles: StoredBundle[], topics: PromptTopic[]) {
  const readable: ReadableBundle[] = [];
  const offTopic: string[] = [];
  for (const bundle of bundles) {
    const content = parseBundleContent(bundle.content);
    const topicIds = content
      ? topics
          .filter((topic) =>
            topic.repositories.some(
              (repository) =>
                repository.id === bundle.repositoryId &&
                touchesScope(bundle.filePaths, repository.pathGlobs),
            ),
          )
          .map((topic) => topic.id)
      : [];
    if (content && topicIds.length > 0) {
      readable.push({ id: bundle.id, content, topicIds });
    } else {
      offTopic.push(bundle.id);
    }
  }
  return { readable, offTopic };
}

export function readTriageReply(
  organizationId: string,
  readable: ReadableBundle[],
  rows: z.infer<typeof triageRow>[],
  topicAt: Map<number, string>,
) {
  const byPosition = new Map(rows.map((row) => [row.id, row]));
  const extract: ExtractRequest[] = [];
  const lowValue: string[] = [];

  for (const [at, bundle] of readable.entries()) {
    const triaged = byPosition.get(at + 1);
    if (!triaged) continue;

    const named = triaged.topicIds.map((number) => topicAt.get(number));
    if (named.includes(undefined)) continue;

    // The maintainer's scope stands when the model names no topic of its own.
    const picked = named.filter(
      (id): id is string => id !== undefined && bundle.topicIds.includes(id),
    );
    const topicIds = picked.length > 0 ? picked : bundle.topicIds;

    if (triaged.worth < FUNNEL.triage.minWorth) lowValue.push(bundle.id);
    else extract.push({ organizationId, bundleId: bundle.id, topicIds });
  }
  return { extract, lowValue };
}

export async function triageBundles(
  organizationId: string,
  bundleIds: string[],
): Promise<ExtractRequest[]> {
  const bundles = await db.knowledgeBundle.findMany({
    where: {
      organizationId,
      id: { in: bundleIds },
      processedAt: null,
      content: { not: Prisma.DbNull },
    },
    select: { id: true, repositoryId: true, filePaths: true, content: true },
  });
  if (bundles.length === 0) return [];

  const topics = (
    await db.knowledgeTopic.findMany({
      where: { organizationId },
      select: { id: true, name: true, description: true, repositories: true },
    })
  ).map(
    (topic): PromptTopic => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      repositories: parseStoredRepositories(topic.repositories),
    }),
  );

  const { readable, offTopic } = narrowByScope(bundles, topics);
  await settleBundles(offTopic, "OFF_TOPIC");
  if (readable.length === 0) return [];

  const inScope = new Set(readable.flatMap((bundle) => bundle.topicIds));
  const { rendered, topicAt } = numberTopics(
    topics.filter((topic) => inScope.has(topic.id)),
  );

  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { slug: true },
  });

  return meteredGenerateText(
    {
      organizationId,
      actorId: null,
      // Triage and extraction are two stages of one feature at one price.
      action: "KNOWLEDGE_EXTRACT",
      orgSlug: organization.slug,
      gatewayModel: env.SCIBLY_KNOWLEDGE_TRIAGE_MODEL,
    },
    {
      system: await loadPrompt("triage"),
      prompt: [
        ...rendered,
        ...readable.map((bundle, at) =>
          renderBundleDigest(at + 1, bundle.content),
        ),
      ].join("\n\n"),
      maxOutputTokens: FUNNEL.triage.maxOutputTokens,
    },
    async (generated) => {
      assertNotTruncated(generated, "Knowledge triage");
      const reply = parseJsonReply(generated.text, triageReply);
      // Transient failure, not an outcome: throwing leaves every bundle unprocessed.
      if (!reply) throw new Error("Knowledge triage returned no usable JSON.");

      const { extract, lowValue } = readTriageReply(
        organizationId,
        readable,
        reply.bundles.filter((row) => row !== null),
        topicAt,
      );
      await settleBundles(lowValue, "LOW_VALUE");
      return extract;
    },
  );
}
