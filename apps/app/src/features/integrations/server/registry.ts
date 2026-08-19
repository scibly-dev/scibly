import type { IntegrationProviderId } from "../contracts";
import type { BaseIntegrationProvider } from "./base-provider";

import { AppError } from "@scibly/api/application-error";

import { INTEGRATION_PROVIDERS } from "../contracts";
import { NotionProvider } from "./providers/notion";

export const PROVIDERS = {
  NOTION: new NotionProvider(),
} satisfies Record<IntegrationProviderId, BaseIntegrationProvider>;

export function isIntegrationProvider(
  providerId: string,
): providerId is IntegrationProviderId {
  return INTEGRATION_PROVIDERS.some((known) => known === providerId);
}

export function getProvider(providerId: string): BaseIntegrationProvider {
  if (!isIntegrationProvider(providerId)) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: `Unknown integration provider: ${providerId}`,
    });
  }
  return PROVIDERS[providerId];
}

export function listProviders(): BaseIntegrationProvider[] {
  return Object.values(PROVIDERS);
}
