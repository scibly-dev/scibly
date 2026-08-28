import type {
  IntegrationPage,
  IntegrationPageContent,
  IntegrationPageRevision,
  IntegrationProviderId,
  OAuthTokens,
} from "../contracts";

export abstract class BaseIntegrationProvider {
  abstract readonly providerId: IntegrationProviderId;
  abstract readonly displayName: string;

  abstract searchPages(
    token: string,
    query: string,
  ): Promise<IntegrationPage[]>;

  listChildren(_token: string, _pageId: string): Promise<IntegrationPage[]> {
    return Promise.resolve([]);
  }

  listDatabasePages(
    _token: string,
    _databaseId: string,
  ): Promise<IntegrationPage[]> {
    return Promise.resolve([]);
  }

  abstract fetchPageContent(
    token: string,
    pageId: string,
  ): Promise<IntegrationPageContent>;

  getPageRevision(
    _token: string,
    _pageId: string,
  ): Promise<IntegrationPageRevision | null> {
    return Promise.resolve(null);
  }

  abstract getAuthUrl(state: string, redirectUri: string): string;

  abstract exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<OAuthTokens>;

  pollModifiedPages(_token: string, _since: Date): Promise<IntegrationPage[]> {
    return Promise.resolve([]);
  }
}
