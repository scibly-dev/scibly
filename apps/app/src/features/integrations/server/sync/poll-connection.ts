import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { SyncLease } from "./sync-lease";

import { notLapsedSubscription } from "@scibly/api/entitlement";
import { TimeHelpers } from "@scibly/api/rate-limit";
import { db, type Prisma } from "@scibly/db";

import { PAGE_INTEGRATION_PROVIDERS } from "@/features/integrations/contracts";
import { resolveConnectionToken } from "@/features/integrations/server/connection-token";
import { getPageProvider } from "@/features/integrations/server/registry";
import { SOURCE_STATUS } from "@/shared/content/sources/constants";

// No webhook exists for any integration, so this scheduled poll is the only way a changed page is noticed; `lastPolledAt` is the per-connection watermark.

export const SYNC_CLOCK_SKEW_MS = TimeHelpers.IN_MS.MINUTE;

export const SYNC_WINDOW_FLOOR_MS = TimeHelpers.IN_MS.DAY * 7;

export const SYNC_HOP_CONNECTION_LIMIT = 10;

const SYNC_BACKOFF_MS: readonly number[] = [
  0,
  0,
  0,
  TimeHelpers.IN_MS.HOUR * 6,
  TimeHelpers.IN_MS.DAY,
  TimeHelpers.IN_MS.DAY * 3,
];
const SYNC_BACKOFF_CAP_MS = TimeHelpers.IN_MS.DAY * 7;

export interface SyncRunTotals {
  polled: number;

  connectionsFailed: number;

  connectionsEmpty: number;

  marked: number;

  unchanged: number;
}

export function backoffMs(consecutiveFailures: number): number {
  return SYNC_BACKOFF_MS[consecutiveFailures] ?? SYNC_BACKOFF_CAP_MS;
}

export type SyncConnection = {
  id: string;
  provider: IntegrationProviderId;
  accessTokenEncrypted: string | null;
  installationId: string | null;
  lastPolledAt: Date | null;
  consecutiveFailures: number;
};

const subscribedOrganization = (now: Date): Prisma.OrganizationWhereInput => ({
  subscription: notLapsedSubscription(now),
});

export async function loadOwedConnections(
  lease: SyncLease,
  now: Date,
  take: number = SYNC_HOP_CONNECTION_LIMIT,
): Promise<SyncConnection[]> {
  return db.integrationConnection.findMany({
    where: {
      organization: subscribedOrganization(now),
      // A connection to a provider without pages has nothing that could go
      // stale, so a poll would only spend a call to learn that.
      provider: { in: [...PAGE_INTEGRATION_PROVIDERS] },
      OR: [
        { lastAttemptedAt: null },
        { lastAttemptedAt: { lt: lease.chainStartedAt } },
      ],
      AND: [{ OR: [{ nextPollAfter: null }, { nextPollAfter: { lte: now } }] }],
    },
    select: {
      id: true,
      provider: true,
      accessTokenEncrypted: true,
      installationId: true,
      lastPolledAt: true,
      consecutiveFailures: true,
    },
    orderBy: { lastAttemptedAt: { sort: "asc", nulls: "first" } },
    take,
  });
}

type SyncableSource = { id: string; externalId: string | null };

async function loadSyncableSources(
  connectionId: string,
): Promise<SyncableSource[]> {
  return db.notebookSource.findMany({
    where: {
      // The column keeps the old name; renaming it needs a migration.
      integrationId: connectionId,
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
// resolving the token is itself what deletes a connection the provider says is
// gone — and a row that is no longer there is nothing left to record, not an
// error that should take the hop down with it.
async function recordAttempt(
  connectionId: string,
  data: Prisma.IntegrationConnectionUpdateManyMutationInput,
): Promise<void> {
  await db.integrationConnection.updateMany({
    where: { id: connectionId },
    data,
  });
}

async function recordPollFailure(
  connection: SyncConnection,
  now: Date,
): Promise<void> {
  const failures = connection.consecutiveFailures + 1;
  const delay = backoffMs(failures);
  await recordAttempt(connection.id, {
    lastAttemptedAt: now,
    consecutiveFailures: failures,
    nextPollAfter: delay > 0 ? new Date(now.getTime() + delay) : null,
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
  totals: SyncRunTotals,
): Promise<void> {
  const changedIds = sources
    .filter(
      (source) =>
        source.externalId !== null && modifiedIds.has(source.externalId),
    )
    .map((source) => source.id);
  totals.unchanged += sources.length - changedIds.length;

  const succeeded = {
    lastPolledAt: pollStartedAt,
    lastAttemptedAt: new Date(),
    consecutiveFailures: 0,
    nextPollAfter: null,
  };
  if (changedIds.length === 0) {
    await recordAttempt(connectionId, succeeded);
    return;
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
  totals.marked += marked.count;
}

export async function pollConnection(
  connection: SyncConnection,
  totals: SyncRunTotals,
): Promise<void> {
  const now = new Date();
  const sources = await loadSyncableSources(connection.id);

  if (sources.length === 0) {
    totals.connectionsEmpty += 1;
    await recordAttempt(connection.id, { lastAttemptedAt: now });
    return;
  }

  const pollFrom = getPollingStart(connection.lastPolledAt, now);
  let modifiedIds: Set<string>;
  try {
    const provider = getPageProvider(connection.provider);
    const token = await resolveConnectionToken(connection);
    const pages = await provider.pollModifiedPages(token, pollFrom);
    modifiedIds = new Set(pages.map((page) => page.id));
  } catch (error) {
    console.error(
      `[IntegrationFreshness] Poll failed for connection ${connection.id} (${connection.provider}):`,
      error,
    );
    totals.connectionsFailed += 1;
    await recordPollFailure(connection, now);
    return;
  }

  totals.polled += 1;
  await commitPollSuccess(connection.id, now, sources, modifiedIds, totals);
}
