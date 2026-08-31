import { decideKnowledgeSync } from "@scibly/api/entitlement";
import { db, Prisma } from "@scibly/db";
import { z } from "zod";

import { inngest } from "@/lib/inngest/client";

import { extractInsights } from "./extract";
import { FUNNEL } from "./thresholds";
import {
  type ExtractRequest,
  recordFunnelFailure,
  triageBundles,
} from "./triage";

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

const extractEvents = (requests: ExtractRequest[]) =>
  requests.map((data) => ({ name: KNOWLEDGE_EXTRACT_EVENT, data }));

/**
 * Inngest's `onFailure` fires on a separate run that is handed one event, which
 * for a batched function is one bundle of fifteen. So the last attempt records
 * its own failure instead: without it the other fourteen sit in the feed
 * looking like pull requests still being read, forever.
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
    // Rethrown either way: Inngest owns the retrying, this only owns the record.
    throw error;
  }
};

/**
 * What a repository is still waiting on: collected, not yet settled, whatever
 * stopped it. Triage is idempotent and cheap, so a manual sync sends these round
 * again rather than making someone wait for the nightly sweep.
 */
export async function unreadBundles(
  organizationId: string,
  repositoryIds: string[],
): Promise<string[]> {
  const waiting = await db.knowledgeBundle.findMany({
    where: {
      organizationId,
      repositoryId: { in: repositoryIds },
      processedAt: null,
      discardReason: null,
      content: { not: Prisma.DbNull },
    },
    orderBy: { collectedAt: "asc" },
    take: FUNNEL.retryBatch,
    select: { id: true },
  });
  return waiting.map((bundle) => bundle.id);
}

/**
 * Bundles the funnel never finished — a dropped event, an organization that ran
 * out of credits mid-batch. Re-sent through triage, which is idempotent and
 * cheap, rather than guessing where each one stopped.
 */
export async function strandedBundles(now = new Date()) {
  const stale = new Date(now.getTime() - FUNNEL.retryAfterMinutes * 60 * 1_000);
  const stranded = await db.knowledgeBundle.findMany({
    where: {
      processedAt: null,
      discardReason: null,
      content: { not: Prisma.DbNull },
      collectedAt: { lt: stale },
    },
    orderBy: { collectedAt: "asc" },
    select: { id: true, organizationId: true },
  });

  const byOrg = new Map<string, string[]>();
  for (const { id, organizationId } of stranded) {
    const ids = byOrg.get(organizationId) ?? [];
    if (ids.length >= FUNNEL.retryBatch) continue;
    ids.push(id);
    byOrg.set(organizationId, ids);
  }
  // The same gate collection is behind: a lapsed organization's stranded
  // bundles wait rather than being read on a plan it no longer has.
  for (const organizationId of byOrg.keys()) {
    const { refusal } = await decideKnowledgeSync(db, organizationId);
    if (refusal) byOrg.delete(organizationId);
  }
  return byOrg;
}

export const knowledgeTriage = inngest.createFunction(
  {
    id: "knowledge-triage",
    name: "Knowledge triage",
    retries: FUNNEL.retries,
    // One model call per batch, and the key keeps an organization's bundles
    // from being judged against another organization's topics.
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
      await step.sendEvent("request-extractions", extractEvents(extract));
    }
    return { triaged: requests.length, extracting: extract.length };
  },
);

export const knowledgeExtract = inngest.createFunction(
  {
    id: "knowledge-extract",
    name: "Knowledge extract",
    retries: FUNNEL.retries,
    // Extraction is the expensive call; two at a time per organization keeps a
    // busy repository from monopolising the gateway.
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
    const byOrg = await strandedBundles();
    for (const [organizationId, bundleIds] of byOrg) {
      await step.sendEvent(
        `retry-${organizationId}`,
        triageEvents(organizationId, bundleIds),
      );
    }
    return { organizations: byOrg.size };
  },
);
