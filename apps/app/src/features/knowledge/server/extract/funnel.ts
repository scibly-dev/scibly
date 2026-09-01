import { allowedToKnowledgeSync } from "@scibly/api/entitlement";
import { db, Prisma } from "@scibly/db";
import { z } from "zod";

import { inngest } from "@/lib/inngest/client";

import {
  giveUpOnBundles,
  isExhausted,
  recordFunnelFailure,
} from "./bundle-lifecycle";
import { extractInsights } from "./extract";
import { FUNNEL } from "./thresholds";
import { triageBundles } from "./triage";

export const KNOWLEDGE_TRIAGE_EVENT = "scibly/knowledge-triage.requested";
export const KNOWLEDGE_EXTRACT_EVENT = "scibly/knowledge-extract.requested";

const triageRequest = z.object({
  organizationId: z.string().min(1),
  bundleId: z.string().min(1),
});

const extractRequest = triageRequest.extend({
  topicIds: z.array(z.string().min(1)).min(1),
});

export const triageEvents = (
  organizationId: string,
  bundleIds: string[],
): { name: string; data: z.infer<typeof triageRequest> }[] =>
  bundleIds.map((bundleId) => ({
    name: KNOWLEDGE_TRIAGE_EVENT,
    data: { organizationId, bundleId },
  }));

/**
 * Inngest's `onFailure` sees only one event of a batch, so the last attempt
 * records the failure for every bundle it was handed.
 */
export const recordingFailure = async <T>(
  attempt: number,
  bundleIds: string[],
  run: () => Promise<T>,
): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (attempt >= FUNNEL.retries) await recordFunnelFailure(bundleIds, error);
    throw error;
  }
};

/** The age cutoff separates stranded from in flight: a queued triage costs a model call. */
const strandedWhere = (now: Date): Prisma.KnowledgeBundleWhereInput => ({
  processedAt: null,
  discardReason: null,
  content: { not: Prisma.DbNull },
  collectedAt: {
    lt: new Date(now.getTime() - FUNNEL.retryAfterMinutes * 60 * 1_000),
  },
});

export async function unreadBundles(
  organizationId: string,
  repositoryIds: string[],
  now = new Date(),
): Promise<string[]> {
  const waiting = await db.knowledgeBundle.findMany({
    where: {
      ...strandedWhere(now),
      organizationId,
      repositoryId: { in: repositoryIds },
    },
    orderBy: { collectedAt: "asc" },
    take: FUNNEL.retryBatch,
    select: { id: true },
  });
  return waiting.map((bundle) => bundle.id);
}

export async function strandedBundles(now = new Date()) {
  const stranded = await db.knowledgeBundle.findMany({
    where: strandedWhere(now),
    orderBy: { collectedAt: "asc" },
    // A ceiling on the night's work, not on the backlog: the rest come round tomorrow.
    take: FUNNEL.strandedScan,
    select: { id: true, organizationId: true, attempts: true },
  });

  // Past this many nights it is not a transient outage, and each retry costs a paid call.
  const exhausted = stranded
    .filter((bundle) => isExhausted(bundle.attempts))
    .map((bundle) => bundle.id);
  await giveUpOnBundles(exhausted);

  const byOrg = new Map<string, string[]>();
  for (const { id, organizationId, attempts } of stranded) {
    if (isExhausted(attempts)) continue;
    const ids = byOrg.get(organizationId) ?? [];
    if (ids.length >= FUNNEL.retryBatch) continue;
    ids.push(id);
    byOrg.set(organizationId, ids);
  }

  // Asked for every organization at once, so one unresolvable subscription
  // is refused rather than taking the night's sweep down with it.
  const allowed = await allowedToKnowledgeSync(db, [...byOrg.keys()]);
  for (const organizationId of byOrg.keys()) {
    if (!allowed.has(organizationId)) byOrg.delete(organizationId);
  }
  return { byOrg, gaveUp: exhausted.length };
}

export const knowledgeTriage = inngest.createFunction(
  {
    id: "knowledge-triage",
    name: "Knowledge triage",
    retries: FUNNEL.retries,
    // Keyed so an organization's bundles are never judged against another's topics.
    batchEvents: {
      maxSize: FUNNEL.triage.batchSize,
      timeout: "60s",
      key: "event.data.organizationId",
    },
    triggers: [{ event: KNOWLEDGE_TRIAGE_EVENT }],
  },
  async ({ attempt, events, step }) => {
    const requests = events.map((event) => triageRequest.parse(event.data));
    const organizationId = requests[0]!.organizationId;
    const bundleIds = requests.map((request) => request.bundleId);
    const extract = await recordingFailure(attempt, bundleIds, () =>
      triageBundles(organizationId, bundleIds),
    );
    if (extract.length > 0) {
      await step.sendEvent(
        "request-extractions",
        extract.map((data) => ({ name: KNOWLEDGE_EXTRACT_EVENT, data })),
      );
    }
    return { triaged: requests.length, extracting: extract.length };
  },
);

export const knowledgeExtract = inngest.createFunction(
  {
    id: "knowledge-extract",
    name: "Knowledge extract",
    retries: FUNNEL.retries,
    // Two at a time keeps a busy repository from monopolising the gateway.
    concurrency: [{ key: "event.data.organizationId", limit: 2 }],
    triggers: [{ event: KNOWLEDGE_EXTRACT_EVENT }],
  },
  ({ attempt, event }) => {
    const request = extractRequest.parse(event.data);
    return recordingFailure(attempt, [request.bundleId], () =>
      extractInsights(request),
    );
  },
);

export const knowledgeFunnelRetry = inngest.createFunction(
  {
    id: "knowledge-funnel-retry",
    name: "Knowledge funnel retry",
    retries: 2,
    // After the nightly collection, so a bundle gets one night's grace first.
    triggers: [{ cron: "0 6 * * *" }],
  },
  async ({ step }) => {
    const { byOrg, gaveUp } = await strandedBundles();
    for (const [organizationId, bundleIds] of byOrg) {
      await step.sendEvent(
        `retry-${organizationId}`,
        triageEvents(organizationId, bundleIds),
      );
    }
    return { organizations: byOrg.size, gaveUp };
  },
);
