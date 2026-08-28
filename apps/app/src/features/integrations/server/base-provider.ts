import type {
  IntegrationCredential,
  IntegrationCredentialKind,
  IntegrationGrantList,
  IntegrationPage,
  IntegrationPageContent,
  IntegrationPageRevision,
  IntegrationProviderId,
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
 * A capability beyond that is an optional method, and having the method is the
 * capability — there is no second place where a provider restates what it can
 * do.
 */
export abstract class IntegrationProvider {
  abstract readonly providerId: IntegrationProviderId;
  abstract readonly displayName: string;

  /** Which credential shape a finished connect leaves behind. */
  abstract readonly credential: IntegrationCredentialKind;

  abstract getAuthUrl(state: string, redirectUri: string): string;

  /** Turn what the provider's redirect carried into the credential to store. */
  abstract completeConnect(
    params: ConnectCallbackParams,
    redirectUri: string,
  ): Promise<IntegrationCredential>;

  /** Present only on a provider whose token is minted per use, not stored. */
  mintAccessToken?(installationId: string): Promise<string>;

  /** Present only on a provider that hands its workspace out piece by piece. */
  listGrants?(token: string): Promise<IntegrationGrantList>;
}

/**
 * A provider whose material is pages: the only kind a notebook can import a
 * source from, and the only kind `PAGE_INTEGRATION_PROVIDERS` names.
 */
export abstract class PageIntegrationProvider extends IntegrationProvider {
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
  abstract listChildren(
    token: string,
    pageId: string,
  ): Promise<IntegrationPage[]>;

  abstract listDatabasePages(
    token: string,
    databaseId: string,
  ): Promise<IntegrationPage[]>;

  /** The cheap edited-at marker a poll checks, when the provider offers one. */
  abstract getPageRevision(
    token: string,
    pageId: string,
  ): Promise<IntegrationPageRevision | null>;

  /** What a poll asks for. Nothing, unless the provider can say what changed. */
  abstract pollModifiedPages(
    token: string,
    since: Date,
  ): Promise<IntegrationPage[]>;
}
