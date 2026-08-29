import type { IntegrationProviderId } from "../contracts";

import { db, type Prisma } from "@scibly/db";

type DetachReason = "disconnected" | "workspace_changed";
type Tx = Prisma.TransactionClient | typeof db;

export function disconnectWarning(provider: IntegrationProviderId): string {
  return `The ${provider} integration is disconnected. Reconnect it to resume syncing.`;
}

export async function warnSourcesOfLostConnection(
  connectionId: string,
  provider: IntegrationProviderId,
  reason: DetachReason,
  tx: Tx = db,
) {
  await tx.notebookSource.updateMany({
    where: { integrationId: connectionId },
    // A disconnect keeps the link so reconnecting the same workspace picks these
    // sources back up; a changed workspace is where the link really is dead.
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
