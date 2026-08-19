import type { IntegrationProviderId } from "../contracts";

import { db } from "@scibly/db";

type DetachReason = "disconnected" | "workspace_changed";

export async function detachSourcesFromConnection(
  connectionId: string,
  provider: IntegrationProviderId,
  reason: DetachReason,
) {
  await db.notebookSource.updateMany({
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
