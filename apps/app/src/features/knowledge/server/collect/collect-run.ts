import type { KnowledgeDiscardReason } from "@scibly/db/enums";
import type {
  PullRequestDetail,
  PullRequestSummary,
} from "@/features/integrations/server";
import type { BundleContent } from "./bundle";

import { db, Prisma } from "@scibly/db";

import {
  fetchPullRequestDetail,
  listMergedPullRequests,
  resolveRepositoryConnection,
} from "@/features/integrations/server";

import { failureMessage } from "../failure-message";
import { requireReachableRepository } from "../topic-scope";
import { buildBundleContent } from "./bundle";
import {
  isDenseEnough,
  rejectFromSummary,
  scoreDiscussionDensity,
} from "./structural-filter";

// ponytail: 50 details fits the route's 300s ceiling; wrap each pull request in
// its own `step.run` if that ever needs to be higher.
const COLLECT_BUDGET = {
  pageSize: 50,
  maxPages: 10,
  maxDetails: 50,
  /** GitHub's secondary limits punish concurrency, not volume — keep this small. */
  detailConcurrency: 5,
  /** Walking the whole history is its own ticket, scibly-dev/scibly#16. */
  firstRunLookbackDays: 14,
} as const;

export interface CollectionResult {
  collected: number;
  discarded: number;
  capped: boolean;
}

async function readWatermark(
  organizationId: string,
  repositoryId: string,
): Promise<Date | null> {
  const previous = await db.knowledgeCollectionRun.findFirst({
    where: {
      organizationId,
      repositoryId,
      status: "SUCCEEDED",
      collectedThrough: { not: null },
    },
    orderBy: { collectedThrough: "desc" },
    select: { collectedThrough: true },
  });
  return previous?.collectedThrough ?? null;
}

// The bound is inclusive: a second pull request sharing the watermark's
// timestamp would otherwise be lost, and re-seeing one is cheap.
async function listSinceWatermark(
  token: string,
  repositoryFullName: string,
  watermark: Date,
): Promise<{ fresh: PullRequestSummary[]; capped: boolean }> {
  const fresh: PullRequestSummary[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < COLLECT_BUDGET.maxPages; page++) {
    const listing = await listMergedPullRequests(token, repositoryFullName, {
      pageSize: COLLECT_BUDGET.pageSize,
      cursor,
    });
    for (const pullRequest of listing.pullRequests) {
      if (pullRequest.updatedAt < watermark) return { fresh, capped: false };
      fresh.push(pullRequest);
    }
    if (!listing.nextCursor) return { fresh, capped: false };
    cursor = listing.nextCursor;
  }
  // Failing here would wedge the repository forever, so own the gap via `capped`.
  return { fresh, capped: true };
}

// ponytail: fixed chunks, not a sliding pool — at 50 details the idle tail
// costs nothing worth a scheduler.
async function fetchDetails(
  token: string,
  externalIds: string[],
): Promise<Map<string, PullRequestDetail | null>> {
  const byId = new Map<string, PullRequestDetail | null>();
  for (
    let at = 0;
    at < externalIds.length;
    at += COLLECT_BUDGET.detailConcurrency
  ) {
    const chunk = externalIds.slice(at, at + COLLECT_BUDGET.detailConcurrency);
    const fetched = await Promise.all(
      chunk.map((externalId) => fetchPullRequestDetail(token, externalId)),
    );
    chunk.forEach((externalId, index) =>
      byId.set(externalId, fetched[index] ?? null),
    );
  }
  return byId;
}

type BundleRow = {
  number: number;
  githubUpdatedAt: Date;
  mergedAt: Date | null;
  score: number | null;
  discardReason: KnowledgeDiscardReason | null;
  content: Prisma.InputJsonValue | typeof Prisma.DbNull;
  // Denormalized from `content` so the feed never loads the whole conversation.
  title: string | null;
  url: string | null;
  filePaths: string[];
  truncated: boolean;
  collectedAt: Date;
  // Cleared on every write: a pull request that moved on GitHub is judged
  // again, so a re-collected bundle re-enters the funnel.
  outcome: null;
  processedAt: null;
};

const discardRow = (
  pullRequest: PullRequestSummary,
  reason: KnowledgeDiscardReason,
  score: number | null,
): BundleRow => ({
  number: pullRequest.number,
  githubUpdatedAt: pullRequest.updatedAt,
  mergedAt: null,
  score,
  discardReason: reason,
  // SQL NULL, not JSON null: `discardReason` is set exactly when this is unset.
  content: Prisma.DbNull,
  title: null,
  url: null,
  filePaths: [],
  truncated: false,
  collectedAt: new Date(),
  outcome: null,
  processedAt: null,
});

const bundleRow = (
  pullRequest: PullRequestSummary,
  content: BundleContent,
  truncated: boolean,
  score: number,
): BundleRow => ({
  number: pullRequest.number,
  githubUpdatedAt: pullRequest.updatedAt,
  mergedAt: pullRequest.mergedAt,
  score,
  discardReason: null,
  content,
  title: content.title,
  url: content.url,
  filePaths: content.filePaths,
  truncated,
  collectedAt: new Date(),
  outcome: null,
  processedAt: null,
});

const finish = (runId: string, result: CollectionResult, through: Date) =>
  db.knowledgeCollectionRun.update({
    where: { id: runId },
    data: {
      status: "SUCCEEDED",
      finishedAt: new Date(),
      collectedThrough: through,
      ...result,
    },
  });

/** Throws on failure so Inngest retries; its `onFailure` writes the FAILED row. */
export async function collectRepository({
  runId,
  organizationId,
  repositoryId,
}: {
  runId: string;
  organizationId: string;
  repositoryId: string;
}): Promise<CollectionResult & { bundleIds: string[] }> {
  const startedAt = new Date();
  await db.knowledgeCollectionRun.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt },
  });

  const connection = await resolveRepositoryConnection(
    organizationId,
    "GITHUB",
  );
  // GitHub's GraphQL cannot address a repository by the stored database id, so
  // the name is resolved once — which also settles reachability.
  const repositoryFullName = await requireReachableRepository(
    connection,
    repositoryId,
  );

  const watermark =
    (await readWatermark(organizationId, repositoryId)) ??
    new Date(
      startedAt.getTime() -
        COLLECT_BUDGET.firstRunLookbackDays * 24 * 60 * 60 * 1_000,
    );

  const { fresh, capped: listingCapped } = await listSinceWatermark(
    connection.token,
    repositoryFullName,
    watermark,
  );
  // Oldest first: a budget-stopped run resumes exactly where it stopped.
  fresh.reverse();

  const known = new Map(
    (
      await db.knowledgeBundle.findMany({
        where: {
          organizationId,
          repositoryId,
          externalId: {
            in: fresh.map((pullRequest) => pullRequest.externalId),
          },
        },
        select: { externalId: true, githubUpdatedAt: true },
      })
    ).map((row) => [row.externalId, row.githubUpdatedAt.getTime()]),
  );

  const unchanged = (pullRequest: PullRequestSummary) =>
    known.get(pullRequest.externalId) === pullRequest.updatedAt.getTime();

  // Must mirror the walk below: same two predicates, same budget.
  const wanted: string[] = [];
  for (const pullRequest of fresh) {
    if (unchanged(pullRequest) || rejectFromSummary(pullRequest)) continue;
    if (wanted.length >= COLLECT_BUDGET.maxDetails) break;
    wanted.push(pullRequest.externalId);
  }
  const detailById = await fetchDetails(connection.token, wanted);

  let collected = 0;
  let discarded = 0;
  let details = 0;
  let capped = listingCapped;
  let collectedThrough = watermark;
  const bundleIds: string[] = [];

  for (const pullRequest of fresh) {
    if (unchanged(pullRequest)) {
      collectedThrough = pullRequest.updatedAt;
      continue;
    }

    const refused = rejectFromSummary(pullRequest);
    let row: BundleRow;
    if (refused) {
      row = discardRow(pullRequest, refused, null);
    } else {
      if (details >= COLLECT_BUDGET.maxDetails) {
        capped = true;
        break;
      }
      details++;
      const detail = detailById.get(pullRequest.externalId) ?? null;
      // Deleted, or moved out of reach between the listing and now.
      if (!detail) {
        collectedThrough = pullRequest.updatedAt;
        continue;
      }
      const score = scoreDiscussionDensity(detail);
      const { content, truncated } = buildBundleContent(detail);
      row = isDenseEnough(score)
        ? bundleRow(pullRequest, content, truncated, score)
        : discardRow(pullRequest, "LOW_DENSITY", score);
    }

    const upserted = await db.knowledgeBundle.upsert({
      where: {
        organizationId_repositoryId_externalId: {
          organizationId,
          repositoryId,
          externalId: pullRequest.externalId,
        },
      },
      create: {
        organizationId,
        repositoryId,
        externalId: pullRequest.externalId,
        ...row,
      },
      update: row,
      select: { id: true },
    });

    if (row.discardReason) discarded++;
    else {
      collected++;
      bundleIds.push(upserted.id);
    }
    collectedThrough = pullRequest.updatedAt;
  }

  const result = { collected, discarded, capped };
  await finish(runId, result, collectedThrough);
  return { ...result, bundleIds };
}

/** GitHub's own message, truncated — never a credential, which the provider strips. */
export async function recordFailedCollection(
  runId: string,
  error: unknown,
): Promise<void> {
  await db.knowledgeCollectionRun.updateMany({
    where: { id: runId, status: { in: ["QUEUED", "RUNNING"] } },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      failureReason: failureMessage(error),
    },
  });
}
