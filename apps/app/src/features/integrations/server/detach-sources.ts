import type { IntegrationProviderId } from "../contracts";

import { db, type Prisma } from "@scibly/db";

type DetachReason = "disconnected" | "workspace_changed";

// Every caller detaches as one half of a pair — the other half deletes or
// replaces the connection row — so the transaction client is a parameter and
// the two halves commit together.
export async function detachSourcesFromConnection(
  connectionId: string,
  provider: IntegrationProviderId,
  reason: DetachReason,
  tx: Prisma.TransactionClient | typeof db = db,
) {
  await tx.notebookSource.updateMany({
    where: { integrationId: connectionId },
    data: {
      integrationId: null,
      warning:
        reason === "disconnected"
          ? `The ${provider} integration was disconnected. This source will no longer sync automatically — reconnect and re-link the page to resume syncing.`
          : `The ${provider} integration was reconnected to a different workspace. This source will no longer sync automatically — re-link the page from the new workspace to resume syncing.`,
    },
  });
}
