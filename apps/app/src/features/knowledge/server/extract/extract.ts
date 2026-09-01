import type { BundleContent } from "../collect/bundle";
import type { ExtractRequest } from "./bundle-lifecycle";

import { hasAppErrorCode } from "@scibly/api/application-error";
import { db } from "@scibly/db";
import { z } from "zod";

import {
  assertNotTruncated,
  meteredGenerateText,
} from "@/features/organizations/server";
import { parseJsonReply } from "@/shared/ai/json-reply";

import { parseStoredRepositories } from "../topic-repositories";
import {
  markUnfunded,
  settleBundles,
  settleBundlesOp,
} from "./bundle-lifecycle";
import {
  citableUrls,
  loadPrompt,
  numberTopics,
  parseBundleContent,
  type PromptTopic,
  renderBundle,
} from "./prompts";
import { FUNNEL } from "./thresholds";

const extractInsight = z.object({
  // A position in the prompt, not a cuid — see `numberTopics`.
  topicId: z.coerce.number().int(),
  claim: z.string(),
  citations: z
    .array(z.object({ url: z.string(), label: z.string().catch("") }))
    .catch([]),
  confidence: z.coerce.number(),
});

const extractReply = z.object({
  insights: z.array(extractInsight.nullable().catch(null)),
});

type Insight = {
  topicId: string;
  claim: string;
  citations: { url: string; label: string }[];
  confidence: number;
};

export function keepableInsights(
  insights: z.infer<typeof extractInsight>[],
  content: BundleContent,
  topicAt: Map<number, string>,
): Insight[] {
  const allowed = citableUrls(content);
  return insights
    .flatMap((insight) => {
      const topicId = topicAt.get(insight.topicId);
      if (
        topicId === undefined ||
        insight.claim.trim().length === 0 ||
        insight.confidence < FUNNEL.extract.minConfidence
      )
        return [];
      const citations = insight.citations
        .filter((citation) => allowed.has(citation.url))
        .map((citation) => ({
          url: citation.url,
          label: citation.label || content.title,
        }));
      if (citations.length === 0) return [];
      return [
        {
          topicId,
          claim: insight.claim.trim(),
          citations,
          confidence: Math.round(insight.confidence),
        },
      ];
    })
    .slice(0, FUNNEL.extract.maxInsights);
}

export async function extractInsights({
  organizationId,
  bundleId,
  topicIds,
}: ExtractRequest): Promise<{ insights: number }> {
  const bundle = await db.knowledgeBundle.findFirst({
    where: { id: bundleId, organizationId, processedAt: null },
    select: { id: true, content: true },
  });
  const content = bundle ? parseBundleContent(bundle.content) : null;
  if (!bundle || !content) return { insights: 0 };

  const topics = (
    await db.knowledgeTopic.findMany({
      where: { organizationId, id: { in: topicIds } },
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
  if (topics.length === 0) {
    await settleBundles([bundleId], "OFF_TOPIC");
    return { insights: 0 };
  }

  const { rendered, topicAt } = numberTopics(topics);

  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { slug: true },
  });

  try {
    return await meteredGenerateText(
      {
        organizationId,
        actorId: null,
        action: "KNOWLEDGE_EXTRACT",
        orgSlug: organization.slug,
      },
      {
        system: await loadPrompt("extract"),
        prompt: [...rendered, renderBundle(bundleId, content)].join("\n\n"),
        maxOutputTokens: FUNNEL.extract.maxOutputTokens,
      },
      async (generated) => {
        assertNotTruncated(generated, "Knowledge extraction");
        const reply = parseJsonReply(generated.text, extractReply);
        // Transient failure, not an outcome: settling would prune the conversation.
        if (!reply) {
          throw new Error("Knowledge extraction returned no usable JSON.");
        }
        const keepable = keepableInsights(
          reply.insights.filter((insight) => insight !== null),
          content,
          topicAt,
        );

        await db.$transaction([
          ...(keepable.length > 0
            ? [
                db.knowledgeInsight.deleteMany({ where: { bundleId } }),
                db.knowledgeInsight.createMany({
                  data: keepable.map((insight) => ({
                    organizationId,
                    bundleId,
                    topicId: insight.topicId,
                    claim: insight.claim,
                    citations: insight.citations,
                    confidence: insight.confidence,
                  })),
                }),
              ]
            : []),
          settleBundlesOp(
            [bundleId],
            keepable.length > 0 ? "EXTRACTED" : "NO_INSIGHTS",
          ),
        ]);

        return { insights: keepable.length };
      },
    );
  } catch (error) {
    if (!hasAppErrorCode(error, "PAYMENT_REQUIRED")) throw error;
    await markUnfunded(bundleId);
    return { insights: 0 };
  }
}
