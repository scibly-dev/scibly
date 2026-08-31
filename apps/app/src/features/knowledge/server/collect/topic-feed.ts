import type { TopicRepository } from "../topic-repositories";

import { db } from "@scibly/db";
import { z } from "zod";

import { touchesScope } from "../topic-repositories";

/** A window, not pages: everything older lives in the topic document. */
const FEED_WINDOW = { runs: 20, bundles: 50, insights: 50 } as const;

const citations = z
  .array(z.object({ url: z.string(), label: z.string().catch("") }))
  .catch([]);

// A scope is per topic and a bundle is per repository, so path filtering
// happens in JS after the windowed query.
export async function loadTopicFeed(
  organizationId: string,
  topicId: string,
  repositories: TopicRepository[],
) {
  if (repositories.length === 0) {
    return {
      runs: [],
      bundles: [],
      insights: [],
      reading: { count: 0, since: null },
      failed: { count: 0, reason: null },
    };
  }
  const repositoryIds = repositories.map((repository) => repository.id);
  const nameById = new Map(
    repositories.map((repository) => [repository.id, repository.fullName]),
  );
  const globsById = new Map(
    repositories.map((repository) => [repository.id, repository.pathGlobs]),
  );

  const [runs, stored, insights] = await Promise.all([
    db.knowledgeCollectionRun.findMany({
      where: { organizationId, repositoryId: { in: repositoryIds } },
      orderBy: { startedAt: "desc" },
      take: FEED_WINDOW.runs,
      select: {
        id: true,
        repositoryId: true,
        status: true,
        startedAt: true,
        collected: true,
        discarded: true,
        capped: true,
        failureReason: true,
      },
    }),
    db.knowledgeBundle.findMany({
      where: {
        organizationId,
        repositoryId: { in: repositoryIds },
        discardReason: null,
      },
      orderBy: { collectedAt: "desc" },
      take: FEED_WINDOW.bundles,
      // Never select `content`: the feed is polled.
      select: {
        id: true,
        repositoryId: true,
        number: true,
        title: true,
        url: true,
        filePaths: true,
        truncated: true,
        outcome: true,
        processedAt: true,
        collectedAt: true,
        failureReason: true,
      },
    }),
    db.knowledgeInsight.findMany({
      where: { organizationId, topicId, status: "PROPOSED" },
      orderBy: { createdAt: "desc" },
      take: FEED_WINDOW.insights,
      select: {
        id: true,
        bundleId: true,
        claim: true,
        citations: true,
        confidence: true,
        createdAt: true,
      },
    }),
  ]);

  // A run says collection is done; it says nothing about the funnel behind it.
  // A bundle with no outcome is still on its way through triage and extraction,
  // and the page must not read as finished while any remain. A bundle the funnel
  // gave up on is neither — it is waiting to be sent round again.
  const unsettled: Date[] = [];
  const failures: string[] = [];
  // Per source, so a row can say what reading it produced rather than leaving
  // the count to be inferred from a list of claims somewhere else on the page.
  const insightsPerBundle = new Map<string, number>();
  for (const insight of insights) {
    if (insight.bundleId === null) continue;
    insightsPerBundle.set(
      insight.bundleId,
      (insightsPerBundle.get(insight.bundleId) ?? 0) + 1,
    );
  }
  const bundles = stored.flatMap((bundle) => {
    if (bundle.title === null || bundle.url === null) return [];
    const globs = globsById.get(bundle.repositoryId) ?? [];
    if (!touchesScope(bundle.filePaths, globs)) return [];
    if (bundle.processedAt === null) {
      if (bundle.outcome === null) unsettled.push(bundle.collectedAt);
      else if (bundle.outcome === "FAILED") {
        failures.push(bundle.failureReason ?? "");
      }
    }
    return [
      {
        id: bundle.id,
        number: bundle.number,
        title: bundle.title,
        url: bundle.url,
        repository: nameById.get(bundle.repositoryId) ?? bundle.repositoryId,
        truncated: bundle.truncated,
        // Only GitHub collects today. The field is what a Slack thread or a
        // Linear issue would fill in, so a row never has to guess its own icon.
        provider: "GITHUB" as const,
        // No outcome yet means the funnel still has it — the one state the
        // enum cannot spell, because it is the absence of a verdict.
        status: bundle.outcome ?? ("READING" as const),
        insightCount: insightsPerBundle.get(bundle.id) ?? 0,
        collectedAt: bundle.collectedAt,
        // When the funnel settled it. Null while it is still being read, and on
        // a FAILED bundle waiting for the retry — the activity timeline falls
        // back to `collectedAt` for those.
        processedAt: bundle.processedAt,
      },
    ];
  });

  return {
    runs: runs.map(({ repositoryId, ...run }) => ({
      ...run,
      repository: nameById.get(repositoryId) ?? repositoryId,
      // Same reasoning as on bundles: a run row never has to guess its icon.
      provider: "GITHUB" as const,
    })),
    bundles,
    // `since` is the oldest of them, so a caller polling on this has something
    // to give up on when the funnel died rather than finished.
    reading: { count: unsettled.length, since: unsettled.at(-1) ?? null },
    // One reason, not one per bundle: a batch of fifteen fails on the same call,
    // and fifteen copies of a gateway error is not fifteen things to read.
    failed: { count: failures.length, reason: failures[0] ?? null },
    // Every url here was checked against its bundle before it was stored, so
    // the feed may link them without asking again. `bundleId` stays: it is how
    // the page files a claim under the source it was read from.
    insights: insights.map((insight) => ({
      ...insight,
      citations: citations.parse(insight.citations),
    })),
  };
}
