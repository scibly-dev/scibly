import type { IntegrationProviderId } from "../contracts";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { decryptApiKey } from "@/lib/crypto/api-key";

import { IntegrationRevokedError } from "./base-provider";
import { DISCONNECTED_CREDENTIAL } from "./connection-state";
import { warnSourcesOfLostConnection } from "./detach-sources";
import { getProvider } from "./registry";

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

function revoked(provider: string): AppError {
  return new AppError({
    code: "NOT_FOUND",
    applicationCode: "integration.revoked",
    message: `The ${provider} integration was removed on ${provider}'s side, so it was disconnected here too. Connect again to resume.`,
  });
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
      await db.$transaction(async (tx) => {
        await warnSourcesOfLostConnection(
          connection.id,
          provider.providerId,
          "disconnected",
          tx,
        );
        await tx.integrationConnection.updateMany({
          where: { id: connection.id },
          data: DISCONNECTED_CREDENTIAL,
        });
      });
      throw revoked(provider.providerId);
    }
  }

  if (!connection.accessTokenEncrypted) throw unusable(provider.providerId);
  return decryptApiKey(connection.accessTokenEncrypted);
}
