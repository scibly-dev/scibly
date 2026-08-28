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
// The ladder plateaus at its last rung rather than at the window floor: a gap
// as long as `SYNC_WINDOW_FLOOR_MS` is exactly the gap `getPollingStart` can no
// longer reach back across, so a connection backed off that far would return to
// a window that starts after the changes it was backed off through.
const SYNC_BACKOFF_CAP_MS = TimeHelpers.IN_MS.DAY * 3;

export function backoffMs(consecutiveFailures: number): number {
  return SYNC_BACKOFF_MS[consecutiveFailures] ?? SYNC_BACKOFF_CAP_MS;
}

export async function loadDueConnections(
  now: Date,
): Promise<{ id: string; provider: string }[]> {
  return db.integrationConnection.findMany({
    where: {
      organization: { subscription: notLapsedSubscription(now) },
      // A connection to a provider without pages has nothing that could go
      // stale, so a poll would only spend a call to learn that.
      provider: { in: [...PAGE_INTEGRATION_PROVIDERS] },
      // Two ORs, so both go through `AND`: a disconnected connection keeps its
      // row so its sources keep their link, but there is nothing left to poll
      // it with.
      AND: [
        CONNECTED,
        { OR: [{ nextPollAfter: null }, { nextPollAfter: { lte: now } }] },
      ],
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

// `updateMany`, not `update`: a poll can outlive the connection it is polling —
// the organization can disconnect or delete it mid-run — and a row that is no
// longer there is nothing left to record, not a failure worth retrying the
// whole poll for.
async function recordAttempt(
  connectionId: string,
  data: Prisma.IntegrationConnectionUpdateManyMutationInput,
): Promise<void> {
  await db.integrationConnection.updateMany({
    where: { id: connectionId },
    data,
  });
}

// One batch, because the watermark is a claim about the marks: it says
// everything up to `pollStartedAt` has been accounted for, which is only true
// if the sources this poll found changed were actually marked stale. Advancing
// it on its own would put those changes permanently behind the window.
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
    // The watermark takes the instant the poll started, so an edit made while
    // it ran is covered by the next poll rather than missed.
    lastPolledAt: pollStartedAt,
    lastAttemptedAt: new Date(),
    consecutiveFailures: 0,
    nextPollAfter: null,
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

  const sources = await loadSyncableSources(connection.id);
  if (sources.length === 0) {
    await recordAttempt(connection.id, { lastAttemptedAt: now });
    return { status: "empty" };
  }

  const provider = getPageProvider(connection.provider);
  // Not the stored token: an app installation stores only its id and mints the
  // token it stands for here, per poll.
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
  await recordAttempt(connectionId, {
    lastAttemptedAt: now,
    consecutiveFailures: failures,
    nextPollAfter: delay > 0 ? new Date(now.getTime() + delay) : null,
  });
}
