import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client";
import type {
  IntegrationCredential,
  IntegrationPage,
  IntegrationPageContent,
  IntegrationPageRevision,
} from "../../contracts";
import type { ConnectCallbackParams } from "../base-provider";

import {
  APIErrorCode,
  Client,
  isFullPage,
  isNotionClientError,
} from "@notionhq/client";
import { routes } from "@scibly/routes";

import { env } from "@/env";

import { PageIntegrationProvider } from "../base-provider";
import {
  collectNotionChildPages,
  extractNotionPageIcon,
  extractNotionPageTitle,
  listNotionDatabasePages,
} from "./notion-pages";

// The SDK waits a minute by default and retries, which a four-minute sync hop cannot afford.
const NOTION_TIMEOUT_MS = 30_000;

// Bounds a walk back to the watermark that nothing else bounds; hitting it throws, because the caller advances its watermark on whatever comes back.
const MAX_POLL_PAGES = 50;
const POLL_PAGE_SIZE = 100;

const notionClient = (auth?: string) =>
  new Client({ auth, timeoutMs: NOTION_TIMEOUT_MS });

// A deleted or un-shared page has no revision to report; the caller decides what that means.
const PAGE_GONE = new Set<string>([
  APIErrorCode.ObjectNotFound,
  APIErrorCode.RestrictedResource,
]);

export class NotionProvider extends PageIntegrationProvider {
  readonly providerId = "NOTION";
  readonly displayName = "Notion";
  readonly credential = "oauth_tokens";

  getAuthUrl(state: string, redirectUri: string): string {
    const url = new URL(routes.external.integrations.notion.oauthAuthorize);
    url.searchParams.set("client_id", env.NOTION_CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("owner", "user");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    return url.toString();
  }

  async completeConnect(
    params: ConnectCallbackParams,
    redirectUri: string,
  ): Promise<IntegrationCredential> {
    if (!params.code) {
      throw new Error("Notion returned no authorisation code to exchange.");
    }
    const response = await notionClient().oauth.token({
      client_id: env.NOTION_CLIENT_ID,
      client_secret: env.NOTION_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: redirectUri,
    });
    return {
      kind: "oauth_tokens",
      accessToken: response.access_token,
      workspaceId: response.workspace_id,
      workspaceName: response.workspace_name ?? undefined,
    };
  }

  async searchPages(token: string, query: string): Promise<IntegrationPage[]> {
    const response = await notionClient(token).search({
      query,
      filter: { value: "page", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: 20,
    });
    return response.results.filter(isFullPage).map((page) => ({
      id: page.id,
      title: extractNotionPageTitle(page.properties),
      url: page.url,
      icon: extractNotionPageIcon(page.icon),
      lastEdited: new Date(page.last_edited_time),
    }));
  }

  async pollModifiedPages(
    token: string,
    since: Date,
  ): Promise<IntegrationPage[]> {
    const notion = notionClient(token);
    const sinceIso = since.toISOString();
    const pages: IntegrationPage[] = [];
    let cursor: string | undefined;
    for (let page = 0; ; page += 1) {
      if (page === MAX_POLL_PAGES) {
        throw new Error(
          `Notion reported more than ${MAX_POLL_PAGES * POLL_PAGE_SIZE} pages changed since ${sinceIso}.`,
        );
      }
      const response = await notion.search({
        filter: { value: "page", property: "object" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: POLL_PAGE_SIZE,
        start_cursor: cursor,
      });
      let reachedOlder = false;
      for (const result of response.results) {
        if (!isFullPage(result)) continue;
        if (result.last_edited_time < sinceIso) {
          reachedOlder = true;
          break;
        }
        pages.push({
          id: result.id,
          title: extractNotionPageTitle(result.properties),
          url: result.url,
          icon: extractNotionPageIcon(result.icon),
          lastEdited: new Date(result.last_edited_time),
        });
      }
      if (reachedOlder || !response.has_more || !response.next_cursor) break;
      cursor = response.next_cursor;
    }
    return pages;
  }

  async listChildren(
    token: string,
    pageId: string,
  ): Promise<IntegrationPage[]> {
    return collectNotionChildPages(notionClient(token), pageId);
  }

  async listDatabasePages(
    token: string,
    databaseId: string,
  ): Promise<IntegrationPage[]> {
    return listNotionDatabasePages(notionClient(token), databaseId);
  }

  async getPageRevision(
    token: string,
    pageId: string,
  ): Promise<IntegrationPageRevision | null> {
    const page = await notionClient(token)
      .pages.retrieve({ page_id: pageId })
      .catch((error: unknown) => {
        if (isNotionClientError(error) && PAGE_GONE.has(error.code))
          return null;
        throw error;
      });
    if (!page || !isFullPage(page)) return null;
    return {
      title: extractNotionPageTitle(page.properties),
      lastEdited: new Date(page.last_edited_time),
    };
  }

  async createPage(
    token: string,
    input: { parentPageId: string; title: string; markdown?: string },
  ): Promise<{ id: string; revision: Date }> {
    const page = await notionClient(token).pages.create({
      parent: { page_id: input.parentPageId },
      properties: { title: { title: [{ text: { content: input.title } }] } },
      markdown: input.markdown ?? "",
    });
    return { id: page.id, revision: await this.revisionOf(token, page) };
  }

  async writePage(
    token: string,
    pageId: string,
    input: { title: string; markdown: string },
  ): Promise<{ revision: Date }> {
    const notion = notionClient(token);
    await notion.pages.updateMarkdown({
      page_id: pageId,
      type: "replace_content",
      replace_content: {
        new_str: input.markdown,
        allow_deleting_content: true,
      },
    });
    // Title last: its response carries the revision both writes left behind.
    const page = await notion.pages.update({
      page_id: pageId,
      properties: { title: { title: [{ text: { content: input.title } }] } },
    });
    return { revision: await this.revisionOf(token, page) };
  }

  async movePage(
    token: string,
    pageId: string,
    parentPageId: string,
  ): Promise<void> {
    await notionClient(token).pages.move({
      page_id: pageId,
      parent: { page_id: parentPageId },
    });
  }

  async getParentPageId(token: string, pageId: string): Promise<string | null> {
    const page = await notionClient(token).pages.retrieve({ page_id: pageId });
    if (!isFullPage(page)) return null;
    return page.parent.type === "page_id" ? page.parent.page_id : null;
  }

  async fetchPageContent(
    token: string,
    pageId: string,
  ): Promise<IntegrationPageContent> {
    const notion = notionClient(token);
    const [revision, markdownResponse] = await Promise.all([
      this.getPageRevision(token, pageId),
      notion.pages.retrieveMarkdown({ page_id: pageId }),
    ]);
    return {
      text: markdownResponse.markdown,
      title: revision?.title ?? pageId,

      lastEdited: revision?.lastEdited ?? new Date(),
    };
  }

  private async revisionOf(
    token: string,
    page: PageObjectResponse | PartialPageObjectResponse,
  ): Promise<Date> {
    if (isFullPage(page)) return new Date(page.last_edited_time);
    const revision = await this.getPageRevision(token, page.id);
    if (!revision) {
      throw new Error("Notion did not say when the page was last edited.");
    }
    return revision.lastEdited;
  }
}
