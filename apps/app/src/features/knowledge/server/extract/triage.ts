import type { KnowledgeBundleOutcome } from "@scibly/db/enums";

import { db, Prisma } from "@scibly/db";
import { generateText } from "ai";
import { z } from "zod";

import { env } from "@/env";
import { getLanguageModel } from "@/shared/ai/server/models/registry";

import { failureMessage } from "../failure-message";
import { parseStoredRepositories, touchesScope } from "../topic-repositories";
import {
  loadPrompt,
  parseBundleContent,
  parseJsonReply,
  type PromptTopic,
  renderBundleDigest,
  renderTopic,
} from "./prompts";
import { FUNNEL } from "./thresholds";

export type TriageRequest = { organizationId: string; bundleId: string };

export type ExtractRequest = {
  organizationId: string;
  bundleId: string;
  topicIds: string[];
};

/**
 * Terminal: the content goes, the verdict stays. `title`/`url` survive so the
 * feed can still name a pull request nothing was learned from.
 */
export async function settleBundle(
  bundleId: string,
  outcome: KnowledgeBundleOutcome,
): Promise<void> {
  await db.knowledgeBundle.update({
    where: { id: bundleId },
    data: {
      outcome,
      processedAt: new Date(),
      content: Prisma.DbNull,
      // A retry that got through clears what the attempt before it recorded.
      failureReason: null,
    },
  });
}

/**
 * The funnel stopped rather than reached a verdict, so this is not terminal:
 * `content` and `processedAt` are left alone and the nightly sweep sends the
 * bundle round again. Recorded so the feed can say a pull request could not be
 * read instead of leaving it looking like one still being read.
 */
export async function recordFunnelFailure(
  bundleIds: string[],
  error: unknown,
): Promise<void> {
  await db.knowledgeBundle.updateMany({
    where: { id: { in: bundleIds }, processedAt: null },
    data: { outcome: "FAILED", failureReason: failureMessage(error) },
  });
}

/**
 * Positions in the prompt, not database ids. A cheap model miscopies a
 * 25-character cuid about a third of the time, and every slip landed as a
 * verdict: a wrong topic id settled the bundle OFF_TOPIC for good, a wrong
 * bundle id left it unread forever. Small integers it can copy.
 *
 * `coerce`, because a model that was shown `id="3"` may well answer `"3"`.
 */
const triageReply = z.object({
  bundles: z
    .array(
      z.object({
        id: z.coerce.number().int(),
        topicIds: z.array(z.coerce.number().int()).catch([]),
        worth: z.number().catch(0),
      }),
    )
    .catch([]),
});

/**
 * Sorts a batch of bundles into the topics that cover them and scores how worth
 * documenting each discussion is. One model call for the whole batch, on the
 * cheap tier — triage reads summaries, extraction reads arguments.
 *
 * Returns the bundles worth extracting; everything else is settled here.
 * A bundle the model left out is left alone for the nightly sweep to retry.
 */
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

  // Structural narrowing first: a topic that does not watch the repository, or
  // whose globs the pull request never touched, is not a judgement call.
  const candidates = new Map<string, string[]>();
  const readable = [];
  for (const bundle of bundles) {
    const content = parseBundleContent(bundle.content);
    if (!content) {
      await settleBundle(bundle.id, "OFF_TOPIC");
      continue;
    }
    const matching = topics
      .filter((topic) =>
        topic.repositories.some(
          (repository) =>
            repository.id === bundle.repositoryId &&
            touchesScope(bundle.filePaths, repository.pathGlobs),
        ),
      )
      .map((topic) => topic.id);

    if (matching.length === 0) {
      await settleBundle(bundle.id, "OFF_TOPIC");
      continue;
    }
    candidates.set(bundle.id, matching);
    readable.push({ id: bundle.id, content });
  }
  if (readable.length === 0) return [];

  const inScope = new Set([...candidates.values()].flat());
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { slug: true },
  });
  const { model } = await getLanguageModel(
    undefined,
    organization.slug,
    env.SCIBLY_KNOWLEDGE_TRIAGE_MODEL,
  );

  // 1-based: the prompt reads as a list, and a model that answers 0 for "none"
  // then names nothing rather than the first topic.
  const offered = topics.filter((topic) => inScope.has(topic.id));
  const topicAt = new Map(offered.map((topic, at) => [at + 1, topic.id]));

  const { text } = await generateText({
    model,
    system: await loadPrompt("triage"),
    prompt: [
      ...offered.map((topic, at) => renderTopic(topic, at + 1)),
      ...readable.map((bundle, at) =>
        renderBundleDigest(at + 1, bundle.content),
      ),
    ].join("\n\n"),
  });

  const reply = parseJsonReply(text, triageReply);
  // No usable reply is a transient failure, not a verdict: throwing keeps every
  // bundle unprocessed so the Inngest retry sees them again.
  if (!reply) throw new Error("Knowledge triage returned no usable JSON.");

  const verdicts = new Map(reply.bundles.map((row) => [row.id, row]));
  const extract: ExtractRequest[] = [];
  for (const [at, bundle] of readable.entries()) {
    const verdict = verdicts.get(at + 1);
    if (!verdict) continue;

    const named = verdict.topicIds.map((number) => topicAt.get(number));
    // A number nobody offered is a broken reply, not a judgement. Settling on it
    // would file the pull request as off-topic for good; skipping leaves it for
    // the retry, which is the only honest reading of a reply we cannot parse.
    if (named.includes(undefined)) continue;

    // Coverage was settled structurally, by a maintainer pointing this topic at
    // this repository and these paths. The model only narrows among those
    // candidates — the pick is dropped when it reaches for a topic that scopes
    // another repository, and the maintainer's scope stands when it names none:
    // a description is optional, so silence may only mean there was nothing to
    // read, which is not a verdict worth filing a pull request away on for
    // good. Routine work is filtered by `worth`, which the model can judge.
    const allowed = candidates.get(bundle.id) ?? [];
    const picked = named.filter(
      (id): id is string => id !== undefined && allowed.includes(id),
    );
    const topicIds = picked.length > 0 ? picked : allowed;

    if (verdict.worth < FUNNEL.triage.minWorth) {
      await settleBundle(bundle.id, "LOW_VALUE");
    } else {
      extract.push({ organizationId, bundleId: bundle.id, topicIds });
    }
  }
  return extract;
}
