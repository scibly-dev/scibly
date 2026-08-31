import type { BundleContent } from "../collect/bundle";
import type { ExtractRequest } from "./triage";

import { hasAppErrorCode } from "@scibly/api/application-error";
import { db, Prisma } from "@scibly/db";
import { generateText } from "ai";
import { z } from "zod";

import { fundGeneration } from "@/features/organizations/server";
import { getLanguageModel } from "@/shared/ai/server/models/registry";

import { parseStoredRepositories } from "../topic-repositories";
import {
  citableUrls,
  loadPrompt,
  parseBundleContent,
  parseJsonReply,
  type PromptTopic,
  renderBundle,
  renderTopic,
} from "./prompts";
import { FUNNEL } from "./thresholds";
import { settleBundle } from "./triage";

const extractReply = z.object({
  insights: z
    .array(
      z.object({
        // A position in the prompt, not a cuid — see `triageReply`.
        topicId: z.coerce.number().int(),
        claim: z.string(),
        citations: z
          .array(z.object({ url: z.string(), label: z.string().catch("") }))
          .catch([]),
        confidence: z.number().catch(0),
      }),
    )
    .catch([]),
});

type Insight = {
  topicId: string;
  claim: string;
  citations: { url: string; label: string }[];
  confidence: number;
};

/**
 * Keeps only what the bundle can back: a topic that was offered, prose, a
 * confidence above the floor, and at least one citation the bundle actually
 * contains. Dropping an unciteable claim is what makes the `citations` column
 * trustworthy — the model never gets to write a URL that was not already in
 * front of it.
 */
export function keepableInsights(
  reply: z.infer<typeof extractReply>,
  content: BundleContent,
  topicAt: Map<number, string>,
): Insight[] {
  const allowed = citableUrls(content);
  return reply.insights
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

/**
 * Re-authors one bundle's discussion into cited claims, metered as one
 * generation. Idempotent: a bundle already settled has no content left to read.
 *
 * Running out of credits is recorded, not swallowed and not retried into the
 * ground — `UNFUNDED` keeps the content so the nightly sweep tries again once
 * the organization has topped up.
 */
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
  // Every topic was deleted between triage and now.
  if (topics.length === 0) {
    await settleBundle(bundleId, "OFF_TOPIC");
    return { insights: 0 };
  }

  // 1-based positions, the same contract triage answers in.
  const topicAt = new Map(topics.map((topic, at) => [at + 1, topic.id]));

  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { slug: true },
  });
  const { model, isByoai } = await getLanguageModel(
    undefined,
    organization.slug,
  );

  let raw: string;
  try {
    raw = await fundGeneration(
      {
        db,
        organizationId,
        actorId: null,
        action: "KNOWLEDGE_EXTRACT",
        // An organization on its own endpoint pays its provider, not us — the
        // same carve-out chat and ingestion make.
        ownEndpoint: isByoai,
      },
      async () => {
        const { text } = await generateText({
          model,
          system: await loadPrompt("extract"),
          prompt: [
            ...topics.map((topic, at) => renderTopic(topic, at + 1)),
            renderBundle(bundleId, content),
          ].join("\n\n"),
          maxOutputTokens: FUNNEL.extract.maxOutputTokens,
        });
        return text;
      },
    );
  } catch (error) {
    if (!hasAppErrorCode(error, "PAYMENT_REQUIRED")) throw error;
    // Not terminal, so no prune and no `processedAt`.
    await db.knowledgeBundle.update({
      where: { id: bundleId },
      data: { outcome: "UNFUNDED", failureReason: null },
    });
    return { insights: 0 };
  }

  const reply = parseJsonReply(raw, extractReply);
  // Same call as triage makes: an unreadable reply is a transient failure, not
  // a verdict. Settling it would prune the conversation over a stray token.
  if (!reply) throw new Error("Knowledge extraction returned no usable JSON.");
  const keepable = keepableInsights(reply, content, topicAt);

  // One transaction: content is only pruned once the claims read out of it are
  // safely stored, and a re-collected pull request replaces its own claims
  // rather than filing them twice.
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
    db.knowledgeBundle.update({
      where: { id: bundleId },
      data: {
        outcome: keepable.length > 0 ? "EXTRACTED" : "NO_INSIGHTS",
        processedAt: new Date(),
        content: Prisma.DbNull,
        // A retry that got through clears what the attempt before it recorded.
        failureReason: null,
      },
    }),
  ]);

  return { insights: keepable.length };
}
