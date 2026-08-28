import type { SyncLease } from "./sync-lease";

import { TimeHelpers } from "@scibly/api/rate-limit";
import { routes } from "@scibly/routes";

import { env } from "@/env";

import {
  loadOwedConnections,
  pollConnection,
  SYNC_HOP_CONNECTION_LIMIT,
  type SyncRunTotals,
} from "./poll-connection";
import { releaseSyncLease } from "./sync-lease";

export const SYNC_HOP_DEADLINE_MS = TimeHelpers.IN_MS.MINUTE * 4;

export const MAX_SYNC_HOPS = 50;

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
