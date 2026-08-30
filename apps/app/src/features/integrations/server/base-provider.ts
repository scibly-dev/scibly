import type {
  IntegrationCredential,
  IntegrationCredentialKind,
  IntegrationGrant,
  IntegrationGrantList,
  IntegrationPage,
  IntegrationPageContent,
  IntegrationPageRevision,
  IntegrationProviderId,
  PageIntegrationProviderId,
} from "../contracts";

export interface ConnectCallbackParams {
  code: string | null;
  installationId: string | null;
}

export class IntegrationRevokedError extends Error {
  constructor(readonly providerId: IntegrationProviderId) {
    super(`The ${providerId} connection no longer exists on the provider.`);
    this.name = "IntegrationRevokedError";
  }
}

export abstract class IntegrationProvider {
  abstract readonly providerId: IntegrationProviderId;
  abstract readonly displayName: string;

  abstract readonly credential: IntegrationCredentialKind;

  abstract getAuthUrl(state: string, redirectUri: string): string;

  abstract completeConnect(
    params: ConnectCallbackParams,
    redirectUri: string,
  ): Promise<IntegrationCredential>;

  mintAccessToken?(installationId: string): Promise<string>;

  listGrants?(token: string): Promise<IntegrationGrantList>;

  resolveGrant?(
    token: string,
    grantId: string,
  ): Promise<IntegrationGrant | null>;

  listFolders?(token: string, grantId: string): Promise<string[]>;
}

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

  abstract listChildren(
    token: string,
    pageId: string,
  ): Promise<IntegrationPage[]>;

  abstract listDatabasePages(
    token: string,
    databaseId: string,
  ): Promise<IntegrationPage[]>;

  abstract getPageRevision(
    token: string,
    pageId: string,
  ): Promise<IntegrationPageRevision | null>;

  abstract pollModifiedPages(
    token: string,
    since: Date,
  ): Promise<IntegrationPage[]>;
}
