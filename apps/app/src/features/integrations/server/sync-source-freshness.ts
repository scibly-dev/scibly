import { notLapsedSubscription } from "@scibly/api/entitlement";
import { TimeHelpers } from "@scibly/api/rate-limit";
import { db } from "@scibly/db";

import { getProvider } from "@/features/integrations/server/registry";
import { decryptApiKey } from "@/lib/crypto/api-key";
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
const SYNC_BACKOFF_CAP_MS = TimeHelpers.IN_MS.DAY * 7;

export function backoffMs(consecutiveFailures: number): number {
  return SYNC_BACKOFF_MS[consecutiveFailures] ?? SYNC_BACKOFF_CAP_MS;
}

export async function loadDueConnections(
  now: Date,
): Promise<{ id: string; provider: string }[]> {
  return db.integrationConnection.findMany({
    where: {
      organization: { subscription: notLapsedSubscription(now) },
      OR: [{ nextPollAfter: null }, { nextPollAfter: { lte: now } }],
    },
    select: { id: true, provider: true },
    orderBy: { lastAttemptedAt: { sort: "asc", nulls: "first" } },
  });
}

type SyncableSource = { id: string; externalId: string | null };

async function loadSyncableSources(
  integrationId: string,
): Promise<SyncableSource[]> {
  return db.notebookSource.findMany({
    where: {
      integrationId,
      status: SOURCE_STATUS.READY,
      externalId: { not: null },
    },
    select: { id: true, externalId: true },
  });
}

export function getPollingStart(lastPolledAt: Date | null, now: Date): Date {
  const floor = now.getTime() - SYNC_WINDOW_FLOOR_MS;
  if (!lastPolledAt) return new Date(floor);
  return new Date(Math.max(lastPolledAt.getTime() - SYNC_CLOCK_SKEW_MS, floor));
}

async function markChangedSourcesStale(
  sources: SyncableSource[],
  modifiedIds: Set<string>,
): Promise<{ marked: number; unchanged: number }> {
  const changed = sources.filter(
    (source) =>
      source.externalId !== null && modifiedIds.has(source.externalId),
  );
  const unchanged = sources.length - changed.length;
  if (changed.length === 0) return { marked: 0, unchanged };

  const marked = await db.notebookSource.updateMany({
    where: { id: { in: changed.map((source) => source.id) } },
    data: { staleAt: new Date() },
  });
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
      lastPolledAt: true,
    },
  });
  if (!connection) return { status: "gone" };

  const sources = await loadSyncableSources(connection.id);
  if (sources.length === 0) {
    await db.integrationConnection.update({
      where: { id: connection.id },
      data: { lastAttemptedAt: now },
    });
    return { status: "empty" };
  }

  const provider = getProvider(connection.provider);
  const token = decryptApiKey(connection.accessTokenEncrypted);
  const pages = await provider.pollModifiedPages(
    token,
    getPollingStart(connection.lastPolledAt, now),
  );

  const counts = await markChangedSourcesStale(
    sources,
    new Set(pages.map((page) => page.id)),
  );
  await db.integrationConnection.update({
    where: { id: connection.id },
    // The watermark takes `now`, the instant the poll started, so an edit made while it ran is covered by the next poll rather than missed.
    data: {
      lastPolledAt: now,
      lastAttemptedAt: new Date(),
      consecutiveFailures: 0,
      nextPollAfter: null,
    },
  });
  return { status: "polled", ...counts };
}

export async function recordPollFailure(
  connectionId: string,
  now: Date,
): Promise<void> {
  const connection = await db.integrationConnection.findUnique({
    where: { id: connectionId },
    select: { consecutiveFailures: true },
  });
  if (!connection) return;

  const failures = connection.consecutiveFailures + 1;
  const delay = backoffMs(failures);
  await db.integrationConnection.update({
    where: { id: connectionId },
    data: {
      lastAttemptedAt: now,
      consecutiveFailures: failures,
      nextPollAfter: delay > 0 ? new Date(now.getTime() + delay) : null,
    },
  });
}
