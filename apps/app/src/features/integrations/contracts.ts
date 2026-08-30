// Kept dependency-free: the client bundle imports this, so it must never pull in a provider SDK.
import type { IntegrationProvider } from "@scibly/db/enums";

export const INTEGRATION_PROVIDERS = [
  "NOTION",
  "GITHUB",
] as const satisfies readonly IntegrationProvider[];

export type IntegrationProviderId = IntegrationProvider;

export const PAGE_INTEGRATION_PROVIDERS = [
  "NOTION",
] as const satisfies readonly IntegrationProviderId[];

export type PageIntegrationProviderId =
  (typeof PAGE_INTEGRATION_PROVIDERS)[number];

export type RepositoryIntegrationProviderId = Extract<
  IntegrationProviderId,
  "GITHUB"
>;

export const MAX_LINKED_PAGES_PER_REQUEST = 20;

// A provider's raw `?error=` is always mapped to `provider_denied` or `provider_error` first — it must never be echoed into the query string.
export const INTEGRATION_CALLBACK_ERRORS = [
  "provider_denied",
  "provider_error",
  "missing_params",
  "invalid_state",
  "expired_state",
  "state_mismatch",
  "session_mismatch",
  "org_not_found",
  "forbidden",
  "token_exchange_failed",
] as const;

export type IntegrationCallbackError =
  (typeof INTEGRATION_CALLBACK_ERRORS)[number];

export interface IntegrationPage {
  id: string;
  title: string;
  url: string;
  icon?: string;
  lastEdited?: Date;
  isDatabase?: boolean;
}

export interface IntegrationPageContent {
  text: string;
  title: string;
  lastEdited: Date;
}

export interface IntegrationPageRevision {
  title: string;
  lastEdited: Date;
}

export interface IntegrationGrant {
  id: string;
  name: string;
  url: string;
}

// Fewer grants than `totalCount` means the listing stopped at its page budget.
export interface IntegrationGrantList {
  grants: IntegrationGrant[];
  totalCount: number;
}

export interface OAuthTokens {
  accessToken: string;
  workspaceId?: string;
  workspaceName?: string;
}

export interface AppInstallation {
  installationId: string;
  workspaceId?: string;
  workspaceName?: string;
}

export type IntegrationCredential =
  | ({ kind: "oauth_tokens" } & OAuthTokens)
  | ({ kind: "app_installation" } & AppInstallation);

export type IntegrationCredentialKind = IntegrationCredential["kind"];
