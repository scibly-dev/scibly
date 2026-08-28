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
      // A connection the hop cannot even record an attempt for — its database
      // writes failing, not its provider, which `pollConnection` handles — must
      // not take the other nine down with it. The chain moves on; `nextPollAfter`
      // is untouched, so the connection is simply owed again next hop.
      try {
        await pollConnection(connection, totals);
      } catch (error) {
        totals.connectionsFailed += 1;
        console.error(
          `[IntegrationFreshness] Connection ${connection.id} aborted the poll:`,
          error,
        );
      }
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

    if (!(await handOffChain({ token: lease.token }))) {
      // The chain stops here either way; releasing says so, so the next
      // scheduled run starts a fresh one instead of waiting out a lease no
      // hop is holding any more.
      await releaseSyncLease(lease);
      return { totals, continued: false };
    }
    return { totals, continued: true };
  } catch (error) {
    console.error("[IntegrationFreshness] Hop failed:", error);
    await releaseSyncLease(lease).catch(() => undefined);
    return { totals, continued: false };
  }
}

// Whether the next hop actually picked the chain up. A 401 from a rotated
// `CRON_SECRET` answers with a response, not an exception, so an unread status
// is the same silence as a refused connection: the chain is gone and the lease
// it left behind says otherwise.
async function handOffChain(body: { token: string }): Promise<boolean> {
  if (!env.CRON_SECRET) {
    console.error(
      "[IntegrationFreshness] CRON_SECRET is not configured; chain not continued",
    );
    return false;
  }
  try {
    const response = await fetch(routes.app.api.cron.syncIntegrations, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error(
        `[IntegrationFreshness] Handoff refused with ${response.status}; chain not continued`,
      );
    }
    return response.ok;
  } catch (error) {
    console.error(
      "[IntegrationFreshness] Failed to continue the chain:",
      error,
    );
    return false;
  }
}
