import type { IntegrationProviderId } from "../contracts";
import type { IntegrationProvider } from "./base-provider";

import { AppError } from "@scibly/api/application-error";

import { INTEGRATION_PROVIDERS } from "../contracts";
import { PageIntegrationProvider } from "./base-provider";
import { GitHubProvider } from "./providers/github/provider";
import { NotionProvider } from "./providers/notion";

export const PROVIDERS = {
  NOTION: new NotionProvider(),
  GITHUB: new GitHubProvider(),
} satisfies Record<IntegrationProviderId, IntegrationProvider>;

export function isIntegrationProvider(
  providerId: string,
): providerId is IntegrationProviderId {
  return INTEGRATION_PROVIDERS.some((known) => known === providerId);
}

export function getProvider(providerId: string): IntegrationProvider {
  if (!isIntegrationProvider(providerId)) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: `Unknown integration provider: ${providerId}`,
    });
  }
  return PROVIDERS[providerId];
}

// For the page picker and everything downstream of it: a provider id that came
// off a row or a request is only good here if the provider actually has pages.
export function getPageProvider(providerId: string): PageIntegrationProvider {
  const provider = getProvider(providerId);
  if (!(provider instanceof PageIntegrationProvider)) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: `${provider.providerId} offers no pages to read.`,
    });
  }
  return provider;
}

export function listProviders(): IntegrationProvider[] {
  return Object.values(PROVIDERS);
}
