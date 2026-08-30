import { decideKnowledgeSync } from "@scibly/api/entitlement";
import { db, Prisma } from "@scibly/db";
import { z } from "zod";

import { inngest } from "@/lib/inngest/client";

import { parseStoredRepositories } from "../topic-repositories";
import { collectRepository, recordFailedCollection } from "./collect-run";

export const KNOWLEDGE_COLLECT_EVENT = "scibly/knowledge-collect.requested";

// Never a credential: the event log is not a place for tokens.
const collectRequest = z.object({
  runId: z.string().min(1),
  organizationId: z.string().min(1),
  repositoryId: z.string().min(1),
});

type CollectRequest = z.infer<typeof collectRequest>;

/**
 * One QUEUED run per repository: a partial unique index backs the check, so two
 * callers racing past the read both land on the one row.
 */
async function queueCollection(
  organizationId: string,
  repositoryId: string,
): Promise<CollectRequest> {
  const waiting = await db.knowledgeCollectionRun.findFirst({
    where: { organizationId, repositoryId, status: "QUEUED" },
    select: { id: true },
  });
  const run =
    waiting ??
    (await db.knowledgeCollectionRun
      .create({
        data: { organizationId, repositoryId },
        select: { id: true },
      })
      .catch(async (error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return db.knowledgeCollectionRun.findFirstOrThrow({
            where: { organizationId, repositoryId, status: "QUEUED" },
            select: { id: true },
          });
        }
        throw error;
      }));
  return { runId: run.id, organizationId, repositoryId };
}

/**
 * Every trigger goes through here: run rows first, then the events, so the feed
 * always has something to show for a request that was made.
 */
export async function requestCollections(
  pairs: [organizationId: string, repositoryId: string][],
  send: (events: { name: string; data: CollectRequest }[]) => Promise<void>,
): Promise<{ requested: number }> {
  if (pairs.length === 0) return { requested: 0 };
  const requests = await Promise.all(
    pairs.map(([organizationId, repositoryId]) =>
      queueCollection(organizationId, repositoryId),
    ),
  );
  try {
    await send(
      requests.map((data) => ({ name: KNOWLEDGE_COLLECT_EVENT, data })),
    );
  } catch (error) {
    // A failed send marks the queued rows FAILED — nothing would ever finish them.
    await Promise.all(
      requests.map(({ runId }) => recordFailedCollection(runId, error)),
    );
    throw error;
  }
  return { requested: requests.length };
}

async function dueRepositories(): Promise<[string, string][]> {
  const topics = await db.knowledgeTopic.findMany({
    select: { organizationId: true, repositories: true },
  });

  const byOrg = new Map<string, Set<string>>();
  for (const topic of topics) {
    const repositories = byOrg.get(topic.organizationId) ?? new Set<string>();
    for (const { id } of parseStoredRepositories(topic.repositories)) {
      repositories.add(id);
    }
    byOrg.set(topic.organizationId, repositories);
  }

  const due: [string, string][] = [];
  for (const [organizationId, repositories] of byOrg) {
    // A lapsed or downgraded organization keeps its topics and stops collecting.
    const { refusal } = await decideKnowledgeSync(db, organizationId);
    if (refusal) continue;
    for (const repositoryId of repositories)
      due.push([organizationId, repositoryId]);
  }
  return due;
}

export async function requestDueCollections(
  sendEvent: (
    id: string,
    events: { name: string; data: CollectRequest }[],
  ) => Promise<void>,
): Promise<{ requested: number }> {
  return requestCollections(await dueRepositories(), (events) =>
    sendEvent("request-collections", events),
  );
}

export const knowledgeCollectionSync = inngest.createFunction(
  {
    id: "knowledge-collection-sync",
    name: "Knowledge collection sync",
    retries: 2,
    // An hour after the integration poll, so both never queue against the same
    // GitHub installation at once.
    triggers: [{ cron: "0 5 * * *" }],
  },
  ({ step }) =>
    requestDueCollections(async (id, events) => {
      await step.sendEvent(id, events);
    }),
);

export const knowledgeCollect = inngest.createFunction(
  {
    id: "knowledge-collect",
    name: "Knowledge collect",
    retries: 2,
    concurrency: [
      { key: "event.data.organizationId", limit: 3 },
      { key: "event.data.repositoryId", limit: 1 },
    ],
    triggers: [{ event: KNOWLEDGE_COLLECT_EVENT }],
    onFailure: ({ event }) =>
      recordFailedCollection(
        collectRequest.parse(event.data.event.data).runId,
        event.data.error,
      ),
  },
  ({ event }) => collectRepository(collectRequest.parse(event.data)),
);
