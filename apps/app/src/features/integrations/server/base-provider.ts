import type {
  IntegrationCredential,
  IntegrationCredentialKind,
  IntegrationGrant,
  IntegrationPage,
  IntegrationPageContent,
  IntegrationPageRevision,
  IntegrationProviderId,
  OAuthTokens,
  PageIntegrationProviderId,
} from "../contracts";

// Which of the two the provider's redirect carries is decided by its
// `credential`, not by the caller.
export interface ConnectCallbackParams {
  code: string | null;
  installationId: string | null;
}

/**
 * A provider saying the credential behind a connection is gone on its side —
 * the app uninstalled, the grant revoked. Nothing a reconnect cannot fix, and
 * distinct from a call that merely failed, which is why it is worth its own
 * type: only this one means the stored connection is now fiction.
 */
export class IntegrationRevokedError extends Error {
  constructor(readonly providerId: IntegrationProviderId) {
    super(`The ${providerId} connection no longer exists on the provider.`);
    this.name = "IntegrationRevokedError";
  }
}

/**
 * The connection itself: how one is authorised, and what it is worth once made.
 * What the provider behind it is then good for belongs to a subclass — every
 * provider is either a `PageIntegrationProvider` or a
 * `ReadOnlyIntegrationProvider`.
 */
export abstract class BaseIntegrationProvider {
  abstract readonly providerId: IntegrationProviderId;
  abstract readonly displayName: string;

  /** Which credential shape a finished connect leaves behind. */
  abstract readonly credential: IntegrationCredentialKind;

  /** Whether the workspace is reached piece by piece — see `listGrants`. */
  readonly listsGrants: boolean = false;

  abstract getAuthUrl(state: string, redirectUri: string): string;

  /** Turn what the provider's redirect carried into the credential to store. */
  abstract completeConnect(
    params: ConnectCallbackParams,
    redirectUri: string,
  ): Promise<IntegrationCredential>;

  async refreshToken(_refreshToken: string): Promise<OAuthTokens> {
    throw new Error(
      `${this.providerId} does not support token refresh. Reconnect the integration.`,
    );
  }

  /** What the connection reaches, when access was handed out piece by piece. */
  listGrants(_token: string): Promise<IntegrationGrant[]> {
    return Promise.resolve([]);
  }
}

/**
 * A provider whose material is pages: the only kind a notebook can import a
 * source from, and the only kind `PAGE_INTEGRATION_PROVIDERS` names.
 */
export abstract class PageIntegrationProvider extends BaseIntegrationProvider {
  abstract readonly providerId: PageIntegrationProviderId;

  abstract searchPages(
    token: string,
    query: string,
  ): Promise<IntegrationPage[]>;

  abstract fetchPageContent(
    token: string,
    pageId: string,
  ): Promise<IntegrationPageContent>;

  /** Pages held inside another; none unless the provider nests them. */
  listChildren(_token: string, _pageId: string): Promise<IntegrationPage[]> {
    return Promise.resolve([]);
  }

  listDatabasePages(
    _token: string,
    _databaseId: string,
  ): Promise<IntegrationPage[]> {
    return Promise.resolve([]);
  }

  /** The cheap edited-at marker a poll checks, when the provider offers one. */
  getPageRevision(
    _token: string,
    _pageId: string,
  ): Promise<IntegrationPageRevision | null> {
    return Promise.resolve(null);
  }

  /** What a poll asks for. Nothing, unless the provider can say what changed. */
  pollModifiedPages(_token: string, _since: Date): Promise<IntegrationPage[]> {
    return Promise.resolve([]);
  }
}

/**
 * A provider that offers no pages — GitHub, Jira, Slack. Connected for what is
 * read out of it elsewhere, never shown to a notebook as a source.
 */
export abstract class ReadOnlyIntegrationProvider extends BaseIntegrationProvider {}

/** A provider whose token is minted per use instead of stored. */
export interface AppInstallationProvider extends BaseIntegrationProvider {
  readonly credential: "app_installation";
  mintAccessToken(installationId: string): Promise<string>;
}

export function mintsInstallationTokens(
  provider: BaseIntegrationProvider,
): provider is AppInstallationProvider {
  return (
    provider.credential === "app_installation" && "mintAccessToken" in provider
  );
}
