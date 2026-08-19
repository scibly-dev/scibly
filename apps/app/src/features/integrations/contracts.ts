// Kept dependency-free so the client bundle (input schemas, settings card) never pulls in a provider SDK.
export const INTEGRATION_PROVIDERS = ["NOTION"] as const;

export type IntegrationProviderId = (typeof INTEGRATION_PROVIDERS)[number];

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
  pageCount?: number;
  lastEdited: Date;
}

export interface IntegrationPageRevision {
  title: string;
  lastEdited: Date;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  workspaceId?: string;
  workspaceName?: string;
}
