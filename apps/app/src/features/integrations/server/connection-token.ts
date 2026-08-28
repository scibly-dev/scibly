import type { IntegrationProviderId } from "../contracts";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { decryptApiKey } from "@/lib/crypto/api-key";

import { IntegrationRevokedError } from "./base-provider";
import { detachSourcesFromConnection } from "./detach-sources";
import { getProvider } from "./registry";

// The one place that turns what a connection stores into the token its API
// calls carry: an OAuth connection keeps an encrypted token, an app
// installation keeps only its id and mints a fresh token here for each use.
export interface ConnectionCredential {
  id: string;
  provider: IntegrationProviderId;
  accessTokenEncrypted: string | null;
  installationId: string | null;
}

function unusable(provider: string): AppError {
  return new AppError({
    code: "BAD_REQUEST",
    applicationCode: "api.bad_request",
    message: `The ${provider} connection holds no usable credential. Reconnect the integration.`,
  });
}

// Its own application code so the client can say what happened rather than
// showing a connection that has already been taken away.
function revoked(provider: string): AppError {
  return new AppError({
    code: "NOT_FOUND",
    applicationCode: "integration.revoked",
    message: `The ${provider} integration was removed on ${provider}'s side, so the connection was removed here too. Connect again to resume.`,
  });
}

// Uninstalling the app is the provider's own disconnect, just announced
// nowhere: the id we hold is dead and no later call can revive it. Treat it
// exactly as a disconnect pressed here, so the two sides agree again.
async function forgetRevokedConnection(
  connection: ConnectionCredential,
  providerId: IntegrationProviderId,
): Promise<void> {
  await detachSourcesFromConnection(connection.id, providerId, "disconnected");
  await db.integrationConnection.deleteMany({ where: { id: connection.id } });
}

export async function resolveConnectionToken(
  connection: ConnectionCredential,
): Promise<string> {
  const provider = getProvider(connection.provider);

  if (provider.mintAccessToken) {
    if (!connection.installationId) throw unusable(provider.providerId);
    try {
      return await provider.mintAccessToken(connection.installationId);
    } catch (error) {
      if (!(error instanceof IntegrationRevokedError)) throw error;
      await forgetRevokedConnection(connection, provider.providerId);
      throw revoked(provider.providerId);
    }
  }

  if (!connection.accessTokenEncrypted) throw unusable(provider.providerId);
  return decryptApiKey(connection.accessTokenEncrypted);
}
