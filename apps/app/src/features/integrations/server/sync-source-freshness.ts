import { notLapsedSubscription } from "@scibly/api/entitlement";
import { TimeHelpers } from "@scibly/api/rate-limit";
import { db, type Prisma } from "@scibly/db";

import { PAGE_INTEGRATION_PROVIDERS } from "@/features/integrations/contracts";
import {
  CONNECTED,
  isConnected,
} from "@/features/integrations/server/connection-state";
import { resolveConnectionToken } from "@/features/integrations/server/connection-token";
import { getPageProvider } from "@/features/integrations/server/registry";
import { SOURCE_STATUS } from "@/shared/content/sources/constants";

// No integration provider offers a webhook, so this scheduled poll is the only way a changed page is noticed.

export const SYNC_CLOCK_SKEW_MS = TimeHelpers.IN_MS.MINUTE;

export const SYNC_WINDOW_FLOOR_MS = TimeHelpers.IN_MS.DAY * 7;

const SYNC_BACKOFF_MS: readonly number[] = [
  0,
  0,
  0,
  TimeHelpers.IN_MS.HOUR * 6,
  TimeHelpers.IN_MS.DAY,
  TimeHelpers.IN_MS.DAY * 3,
];
// Capped below `SYNC_WINDOW_FLOOR_MS`: a longer backoff would return a connection to a
// window that starts after the changes it slept through.
const SYNC_BACKOFF_CAP_MS = TimeHelpers.IN_MS.DAY * 3;

function backoffMs(consecutiveFailures: number): number {
  return SYNC_BACKOFF_MS[consecutiveFailures] ?? SYNC_BACKOFF_CAP_MS;
}

// One run's worth, oldest-attempt-first — and small enough that the event batch it feeds stays inside Inngest's size limit.
const MAX_DUE_CONNECTIONS_PER_RUN = 500;

export async function loadDueConnections(
  now: Date,
): Promise<{ id: string; provider: string }[]> {
  return db.integrationConnection.findMany({
    where: {
      organization: { subscription: notLapsedSubscription(now) },
      provider: { in: [...PAGE_INTEGRATION_PROVIDERS] },
      // Two ORs cannot share one object, so both go through `AND`.
      AND: [
        CONNECTED,
        { OR: [{ nextPollAfter: null }, { nextPollAfter: { lte: now } }] },
      ],
    },
    select: { id: true, provider: true },
    orderBy: { lastAttemptedAt: { sort: "asc", nulls: "first" } },
    take: MAX_DUE_CONNECTIONS_PER_RUN,
  });
}

type SyncableSource = { id: string; externalId: string | null };

export function getPollingStart(lastPolledAt: Date | null, now: Date): Date {
  const floor = now.getTime() - SYNC_WINDOW_FLOOR_MS;
  if (!lastPolledAt) return new Date(floor);
  return new Date(Math.max(lastPolledAt.getTime() - SYNC_CLOCK_SKEW_MS, floor));
}

// `updateMany` so a poll that outlived its connection records nothing instead of throwing.
async function recordAttempt(
  connectionId: string,
  data: Prisma.IntegrationConnectionUpdateManyMutationInput,
): Promise<void> {
  await db.integrationConnection.updateMany({
    where: { id: connectionId },
    data,
  });
}

// Cleared on the empty branch too: a connection that backed off and then lost its last source would otherwise keep the backoff forever.
const pollSucceeded = (at: Date) => ({
  lastAttemptedAt: at,
  consecutiveFailures: 0,
  nextPollAfter: null,
});

async function commitPollSuccess(
  connectionId: string,
  pollStartedAt: Date,
  sources: SyncableSource[],
  modifiedIds: Set<string>,
): Promise<{ marked: number; unchanged: number }> {
  const changedIds = sources
    .filter(
      (source) =>
        source.externalId !== null && modifiedIds.has(source.externalId),
    )
    .map((source) => source.id);
  const unchanged = sources.length - changedIds.length;

  const succeeded = {
    // The watermark takes the instant the poll started, so an edit made while it ran is covered by the next poll rather than missed.
    lastPolledAt: pollStartedAt,
    ...pollSucceeded(new Date()),
  };
  if (changedIds.length === 0) {
    await recordAttempt(connectionId, succeeded);
    return { marked: 0, unchanged };
  }

  const [marked] = await db.$transaction([
    db.notebookSource.updateMany({
      where: { id: { in: changedIds } },
      data: { staleAt: new Date() },
    }),
    db.integrationConnection.updateMany({
      where: { id: connectionId },
      data: succeeded,
    }),
  ]);
  return { marked: marked.count, unchanged };
}

export type PollOutcome =
  | { status: "gone" }
  | { status: "empty" }
  | { status: "polled"; marked: number; unchanged: number };

// Throws on purpose: the throw is what Inngest retries.
export async function pollConnection(
  connectionId: string,
): Promise<PollOutcome> {
  const now = new Date();
  const connection = await db.integrationConnection.findUnique({
    where: { id: connectionId },
    select: {
      id: true,
      provider: true,
      accessTokenEncrypted: true,
      installationId: true,
      lastPolledAt: true,
    },
  });
  if (!connection || !isConnected(connection)) return { status: "gone" };

  const sources = await db.notebookSource.findMany({
    where: {
      integrationId: connection.id,
      status: SOURCE_STATUS.READY,
      externalId: { not: null },
    },
    select: { id: true, externalId: true },
  });
  if (sources.length === 0) {
    await recordAttempt(connection.id, pollSucceeded(now));
    return { status: "empty" };
  }

  const provider = getPageProvider(connection.provider);
  const token = await resolveConnectionToken(connection);
  const pages = await provider.pollModifiedPages(
    token,
    getPollingStart(connection.lastPolledAt, now),
  );

  const counts = await commitPollSuccess(
    connection.id,
    now,
    sources,
    new Set(pages.map((page) => page.id)),
  );
  return { status: "polled", ...counts };
}

// Incremented by the database, so two failures racing over one connection land on 2; the backoff then needs a second write against that settled count.
export async function recordPollFailure(
  connectionId: string,
  now: Date,
): Promise<void> {
  const [counted] = await db.integrationConnection.updateManyAndReturn({
    where: { id: connectionId },
    data: { lastAttemptedAt: now, consecutiveFailures: { increment: 1 } },
    select: { consecutiveFailures: true },
  });
  if (!counted) return;

  const delay = backoffMs(counted.consecutiveFailures);
  await recordAttempt(connectionId, {
    nextPollAfter: delay > 0 ? new Date(now.getTime() + delay) : null,
  });
}
