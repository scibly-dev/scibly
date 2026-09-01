import type { TopicRepository } from "../topic-repositories";

import { db, Prisma } from "@scibly/db";
import { z } from "zod";

import { globPrefix, touchesScope } from "../topic-repositories";

/** A window, not pages: everything older lives in the topic document. */
const FEED_WINDOW = { runs: 20, bundles: 50, insights: 50 } as const;

const citations = z
  .array(z.object({ url: z.string(), label: z.string().catch("") }))
  .catch([]);

/** A literal prefix as a LIKE pattern, with LIKE's own wildcards defused. */
const likePrefix = (prefix: string) =>
  `${prefix.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;

/**
 * Deliberately loose: `globPrefix` cannot express a full glob, so this is a
 * superset and `touchesScope` still decides in JS.
 */
const scopePredicate = (repositories: TopicRepository[]) =>
  Prisma.join(
    repositories.map((repository) => {
      const prefixes = repository.pathGlobs.map(globPrefix);
      // No globs, or one starting with a metacharacter: the whole repository is in scope.
      if (prefixes.length === 0 || prefixes.some((prefix) => prefix === "")) {
        return Prisma.sql`"repositoryId" = ${repository.id}`;
      }
      return Prisma.sql`(
        "repositoryId" = ${repository.id}
        AND EXISTS (
          SELECT 1 FROM unnest("filePaths") AS "path"
          WHERE "path" LIKE ANY (${prefixes.map(likePrefix)}::text[])
        )
      )`;
    }),
    " OR ",
  );

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

  const [runs, insights, inScope] = await Promise.all([
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
    db.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "knowledge_bundle"
      WHERE "organizationId" = ${organizationId}
        AND "discardReason" IS NULL
        AND (${scopePredicate(repositories)})
      ORDER BY "collectedAt" DESC
      LIMIT ${FEED_WINDOW.bundles}
    `,
  ]);

  const inScopeIds = inScope.map((bundle) => bundle.id);
  const [stored, counted] = await Promise.all([
    db.knowledgeBundle.findMany({
      where: { id: { in: inScopeIds } },
      orderBy: { collectedAt: "desc" },
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
    // Counted at the source, over every status — not off the `PROPOSED` window.
    db.knowledgeInsight.groupBy({
      by: ["bundleId"],
      where: { organizationId, topicId, bundleId: { in: inScopeIds } },
      _count: { _all: true },
    }),
  ]);

  const insightsPerBundle = new Map(
    counted.flatMap((group) =>
      group.bundleId === null ? [] : [[group.bundleId, group._count._all]],
    ),
  );

  const unsettled: Date[] = [];
  const failures: string[] = [];
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
        provider: "GITHUB" as const,
        // The one state the enum cannot spell, because it is the absence of one.
        outcome: bundle.outcome ?? ("READING" as const),
        insightCount: insightsPerBundle.get(bundle.id) ?? 0,
        collectedAt: bundle.collectedAt,
        processedAt: bundle.processedAt,
      },
    ];
  });

  return {
    runs: runs.map(({ repositoryId, ...run }) => ({
      ...run,
      repository: nameById.get(repositoryId) ?? repositoryId,
      provider: "GITHUB" as const,
    })),
    bundles,
    // The newest, not the oldest: the page polls while this looks recent.
    reading: { count: unsettled.length, since: unsettled[0] ?? null },
    // One reason, not one per bundle: a batch of fifteen fails on the same call,
    // and fifteen copies of a gateway error is not fifteen things to read.
    failed: { count: failures.length, reason: failures[0] ?? null },
    insights: insights.map((insight) => ({
      ...insight,
      citations: citations.parse(insight.citations),
    })),
  };
}
