import type { IntegrationProviderId } from "../contracts";

import { db, type Prisma } from "@scibly/db";

type DetachReason = "disconnected" | "workspace_changed";
type Tx = Prisma.TransactionClient | typeof db;

// Written when the connection loses its credential and cleared when it gets one
// back, so both halves have to spell it the same way — a source left holding a
// warning nobody writes any more would never lose it.
export function disconnectWarning(provider: IntegrationProviderId): string {
  return `The ${provider} integration is disconnected. Reconnect it to resume syncing.`;
}

// Every caller warns as one half of a pair — the other half takes the
// credential away — so the transaction client is a parameter and the two halves
// commit together.
export async function warnSourcesOfLostConnection(
  connectionId: string,
  provider: IntegrationProviderId,
  reason: DetachReason,
  tx: Tx = db,
) {
  await tx.notebookSource.updateMany({
    where: { integrationId: connectionId },
    // A disconnect keeps the link. The connection row outlives it, so
    // reconnecting the same workspace picks these sources back up, where
    // clearing `integrationId` would have orphaned them for good. A workspace
    // change is the case where the link really is dead: the pages it names live
    // somewhere we no longer have.
    data:
      reason === "disconnected"
        ? { warning: disconnectWarning(provider) }
        : {
            integrationId: null,
            warning: `The ${provider} integration was reconnected to a different workspace. This source will no longer sync automatically — re-link the page from the new workspace to resume syncing.`,
          },
  });
}

export async function clearDisconnectWarning(
  connectionId: string,
  provider: IntegrationProviderId,
  tx: Tx = db,
) {
  await tx.notebookSource.updateMany({
    where: {
      integrationId: connectionId,
      warning: disconnectWarning(provider),
    },
    data: { warning: null },
  });
}
