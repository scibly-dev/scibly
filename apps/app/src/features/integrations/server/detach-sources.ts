import type { IntegrationProviderId } from "../contracts";

import { db, type Prisma } from "@scibly/db";

type DetachReason = "disconnected" | "workspace_changed";
type Tx = Prisma.TransactionClient | typeof db;

export async function warnSourcesOfLostConnection(
  connectionId: string,
  provider: IntegrationProviderId,
  reason: DetachReason,
  tx: Tx = db,
) {
  await tx.notebookSource.updateMany({
    where: { integrationId: connectionId },
    data:
      reason === "disconnected"
        ? {
            warning: `The ${provider} integration is disconnected. Reconnect it to resume syncing.`,
          }
        : {
            integrationId: null,
            warning: `The ${provider} integration was reconnected to a different workspace. This source will no longer sync automatically — re-link the page from the new workspace to resume syncing.`,
          },
  });
}

export async function clearDisconnectWarning(
  connectionId: string,
  tx: Tx = db,
) {
  await tx.notebookSource.updateMany({
    where: { integrationId: connectionId, warning: { not: null } },
    data: { warning: null },
  });
}
