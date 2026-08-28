// Kept dependency-free so the client bundle (input schemas, settings card) never pulls in a provider SDK.
// `IntegrationProvider` is a type-only import of a generated const object, so it
// is erased at build time and pulls nothing in.
import type { IntegrationProvider } from "@scibly/db/enums";

// The runtime list: `z.enum` and the picker need a value, and `satisfies`
// exhaustiveness checks need a tuple. `satisfies` ties it to the schema, so a
// member that the schema does not have is a compile error here.
export const INTEGRATION_PROVIDERS = [
  "NOTION",
  "GITHUB",
] as const satisfies readonly IntegrationProvider[];

// The union comes from the schema rather than from the array above, so the two
// cannot drift: a provider added to the Prisma enum and not to this file fails
// the `satisfies Record<IntegrationProviderId, ...>` in `server/registry.ts`,
// which is the file that would have to build it anyway.
export type IntegrationProviderId = IntegrationProvider;

// The only providers a notebook is offered as a source. A provider is worth
// connecting before it has pages — see `PageIntegrationProvider`.
export const PAGE_INTEGRATION_PROVIDERS = [
  "NOTION",
] as const satisfies readonly IntegrationProviderId[];

export type PageIntegrationProviderId =
  (typeof PAGE_INTEGRATION_PROVIDERS)[number];

// One request's worth of pages. `linkPagesSchema` caps the input with it and
// the picker clamps its selection to it, so the two cannot drift into a batch
// the server rejects wholesale.
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

// A named part of a workspace a connection reaches — a repository an
// installation was given. A workspace handed over whole grants nothing to list.
export interface IntegrationGrant {
  id: string;
  name: string;
  url: string;
}

// The count is what the provider says it granted, which a listing that stopped
// at its page budget does not have all of. Fewer grants than `totalCount` is
// how the settings page knows it is showing a prefix, not the whole of it.
export interface IntegrationGrantList {
  grants: IntegrationGrant[];
  totalCount: number;
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
