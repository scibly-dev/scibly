import type {
  IntegrationCredential,
  IntegrationPage,
  IntegrationPageContent,
  IntegrationPageRevision,
} from "../../contracts";
import type { ConnectCallbackParams } from "../base-provider";

import { Client, isFullPage } from "@notionhq/client";

import { env } from "@/env";

import { PageIntegrationProvider } from "../base-provider";
import {
  collectNotionChildPages,
  extractNotionPageIcon,
  extractNotionPageTitle,
  listNotionDatabasePages,
} from "./notion-pages";

export class NotionProvider extends PageIntegrationProvider {
  readonly providerId = "NOTION";
  readonly displayName = "Notion";
  readonly credential = "oauth_tokens";

  getAuthUrl(state: string, redirectUri: string): string {
    const url = new URL("https://api.notion.com/v1/oauth/authorize");
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
    const response = await new Client().oauth.token({
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
    const response = await new Client({ auth: token }).search({
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
    const notion = new Client({ auth: token });
    const sinceIso = since.toISOString();
    const pages: IntegrationPage[] = [];
    let cursor: string | undefined;
    do {
      const response = await notion.search({
        filter: { value: "page", property: "object" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: 100,
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
      if (reachedOlder || !response.has_more) break;
      cursor = response.next_cursor ?? undefined;
    } while (cursor);
    return pages;
  }

  async listChildren(
    token: string,
    pageId: string,
  ): Promise<IntegrationPage[]> {
    return collectNotionChildPages(new Client({ auth: token }), pageId);
  }

  async listDatabasePages(
    token: string,
    databaseId: string,
  ): Promise<IntegrationPage[]> {
    return listNotionDatabasePages(new Client({ auth: token }), databaseId);
  }

  async getPageRevision(
    token: string,
    pageId: string,
  ): Promise<IntegrationPageRevision | null> {
    const page = await new Client({ auth: token }).pages.retrieve({
      page_id: pageId,
    });
    if (!isFullPage(page)) return null;
    return {
      title: extractNotionPageTitle(page.properties),
      lastEdited: new Date(page.last_edited_time),
    };
  }

  async fetchPageContent(
    token: string,
    pageId: string,
  ): Promise<IntegrationPageContent> {
    const notion = new Client({ auth: token });
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
}
