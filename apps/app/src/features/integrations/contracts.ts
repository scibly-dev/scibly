// Kept dependency-free so the client bundle (input schemas, settings card) never pulls in a provider SDK.
export const INTEGRATION_PROVIDERS = ["NOTION", "GITHUB"] as const;

export type IntegrationProviderId = (typeof INTEGRATION_PROVIDERS)[number];

// The only providers a notebook is offered as a source. A provider is worth
// connecting before it has pages — see `ReadOnlyIntegrationProvider`.
export const PAGE_INTEGRATION_PROVIDERS = [
  "NOTION",
] as const satisfies readonly IntegrationProviderId[];

export type PageIntegrationProviderId =
  (typeof PAGE_INTEGRATION_PROVIDERS)[number];

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

// A named part of a workspace a connection reaches — a repository an
// installation was given. A workspace handed over whole grants nothing to list.
export interface IntegrationGrant {
  id: string;
  name: string;
  url: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  workspaceId?: string;
  workspaceName?: string;
}

// What an installed app leaves behind instead of tokens. The token it stands
// for is minted per call and never stored.
export interface AppInstallation {
  installationId: string;
  workspaceId?: string;
  workspaceName?: string;
}

// Which shape a connection holds decides both the columns it is written to and
// how its token is later got.
export type IntegrationCredential =
  | ({ kind: "oauth_tokens" } & OAuthTokens)
  | ({ kind: "app_installation" } & AppInstallation);

export type IntegrationCredentialKind = IntegrationCredential["kind"];
