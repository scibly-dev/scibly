import type { IntegrationProviderId } from "@/features/integrations/contracts";

import { notLapsedSubscription } from "@scibly/api/entitlement";
import { TimeHelpers } from "@scibly/api/rate-limit";
import { db, Prisma } from "@scibly/db";
import { routes } from "@scibly/routes";

import { env } from "@/env";
import { PAGE_INTEGRATION_PROVIDERS } from "@/features/integrations/contracts";
import { resolveConnectionToken } from "@/features/integrations/server/connection-token";
import { getPageProvider } from "@/features/integrations/server/registry";
import { SOURCE_STATUS } from "@/shared/content/sources/constants";

// No webhook exists for any integration, so this scheduled poll is the only way a changed page is noticed; `lastPolledAt` is the per-connection watermark.

export const SYNC_CLOCK_SKEW_MS = TimeHelpers.IN_MS.MINUTE;

export const SYNC_WINDOW_FLOOR_MS = TimeHelpers.IN_MS.DAY * 7;

export const SYNC_HOP_CONNECTION_LIMIT = 10;

export const SYNC_HOP_DEADLINE_MS = TimeHelpers.IN_MS.MINUTE * 4;

export const MAX_SYNC_HOPS = 50;

const SYNC_LEASE_MS = TimeHelpers.IN_MS.MINUTE * 10;

const SYNC_BACKOFF_MS: readonly number[] = [
  0,
  0,
  0,
  TimeHelpers.IN_MS.HOUR * 6,
  TimeHelpers.IN_MS.DAY,
  TimeHelpers.IN_MS.DAY * 3,
];
const SYNC_BACKOFF_CAP_MS = TimeHelpers.IN_MS.DAY * 7;

const SYNC_LEASE_ID = "singleton";

export interface SyncLease {
  token: string;
  chainStartedAt: Date;
  hops: number;
}

interface SyncRunTotals {
  polled: number;

  connectionsFailed: number;

  connectionsEmpty: number;

  marked: number;

  unchanged: number;
}

export function backoffMs(consecutiveFailures: number): number {
  return SYNC_BACKOFF_MS[consecutiveFailures] ?? SYNC_BACKOFF_CAP_MS;
}

export async function acquireSyncLease(): Promise<SyncLease | null> {
  const token = crypto.randomUUID();
  const chainStartedAt = new Date();
  const taken = await db.integrationSyncLease.updateMany({
    where: {
      id: SYNC_LEASE_ID,
      heartbeatAt: { lt: new Date(Date.now() - SYNC_LEASE_MS) },
    },
    data: { token, heartbeatAt: new Date(), chainStartedAt, hops: 0 },
  });
  if (taken.count > 0) return { token, chainStartedAt, hops: 0 };

  try {
    await db.integrationSyncLease.create({
      data: {
        id: SYNC_LEASE_ID,
        token,
        heartbeatAt: new Date(),
        chainStartedAt,
        hops: 0,
      },
    });
    return { token, chainStartedAt, hops: 0 };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return null;
    }
    throw error;
  }
}

export async function continueSyncLease(
  token: string,
): Promise<SyncLease | null> {
  const held = await db.integrationSyncLease.updateMany({
    where: { id: SYNC_LEASE_ID, token },
    data: { heartbeatAt: new Date(), hops: { increment: 1 } },
  });
  if (held.count === 0) return null;

  const row = await db.integrationSyncLease.findUnique({
    where: { id: SYNC_LEASE_ID },
    select: { token: true, chainStartedAt: true, hops: true },
  });
  if (!row || row.token !== token) return null;
  return { token, chainStartedAt: row.chainStartedAt, hops: row.hops };
}

export async function releaseSyncLease(lease: SyncLease): Promise<void> {
  await db.integrationSyncLease.updateMany({
    where: { id: SYNC_LEASE_ID, token: lease.token },
    data: { heartbeatAt: new Date(0) },
  });
}

type SyncConnection = {
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

async function recordAttempt(
  connectionId: string,
  data: Prisma.IntegrationConnectionUpdateInput,
): Promise<void> {
  await db.integrationConnection.update({
    where: { id: connectionId },
    data,
  });
}

async function recordPollSuccess(
  connectionId: string,
  pollStartedAt: Date,
): Promise<void> {
  await recordAttempt(connectionId, {
    lastPolledAt: pollStartedAt,
    lastAttemptedAt: new Date(),
    consecutiveFailures: 0,
    nextPollAfter: null,
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

async function markChangedSourcesStale(
  sources: SyncableSource[],
  modifiedIds: Set<string>,
  totals: SyncRunTotals,
): Promise<void> {
  const changed = sources.filter(
    (source) =>
      source.externalId !== null && modifiedIds.has(source.externalId),
  );
  totals.unchanged += sources.length - changed.length;
  if (changed.length === 0) return;

  const marked = await db.notebookSource.updateMany({
    where: { id: { in: changed.map((source) => source.id) } },
    data: { staleAt: new Date() },
  });
  totals.marked += marked.count;
}

async function pollConnection(
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
  await markChangedSourcesStale(sources, modifiedIds, totals);
  await recordPollSuccess(connection.id, now);
}

interface SyncHopResult {
  totals: SyncRunTotals;
  continued: boolean;
}

export async function runSyncHop(lease: SyncLease): Promise<SyncHopResult> {
  const totals: SyncRunTotals = {
    polled: 0,
    connectionsFailed: 0,
    connectionsEmpty: 0,
    marked: 0,
    unchanged: 0,
  };
  const hopStartedAt = Date.now();

  try {
    if (lease.hops >= MAX_SYNC_HOPS) {
      console.error(
        `[IntegrationFreshness] Chain hit MAX_SYNC_HOPS (${MAX_SYNC_HOPS}); stopping. The termination condition is wrong.`,
      );
      await releaseSyncLease(lease);
      return { totals, continued: false };
    }

    // One row more than the hop can poll: a surplus row means the chain still
    // owes work, which is otherwise only knowable by asking a second time.
    // Sound because every connection this hop touches gets `lastAttemptedAt`
    // set to now, which the query's `lt: chainStartedAt` filter then excludes.
    const owed = await loadOwedConnections(
      lease,
      new Date(),
      SYNC_HOP_CONNECTION_LIMIT + 1,
    );
    const connections = owed.slice(0, SYNC_HOP_CONNECTION_LIMIT);
    let deadlineReached = false;
    for (const connection of connections) {
      await pollConnection(connection, totals);
      if (Date.now() - hopStartedAt >= SYNC_HOP_DEADLINE_MS) {
        deadlineReached = true;
        break;
      }
    }

    const stillOwed =
      deadlineReached || owed.length > SYNC_HOP_CONNECTION_LIMIT;
    if (!stillOwed) {
      await releaseSyncLease(lease);
      return { totals, continued: false };
    }

    await handOffChain({ token: lease.token });
    return { totals, continued: true };
  } catch (error) {
    console.error("[IntegrationFreshness] Hop failed:", error);
    await releaseSyncLease(lease).catch(() => undefined);
    return { totals, continued: false };
  }
}

async function handOffChain(body: { token: string }): Promise<void> {
  if (!env.CRON_SECRET) {
    console.error(
      "[IntegrationFreshness] CRON_SECRET is not configured; chain not continued",
    );
    return;
  }
  try {
    await fetch(routes.app.api.cron.syncIntegrations, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error(
      "[IntegrationFreshness] Failed to continue the chain:",
      error,
    );
  }
}
