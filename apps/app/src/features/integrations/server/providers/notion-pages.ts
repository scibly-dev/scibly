import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { IntegrationPage } from "../../contracts";

import { type Client, isFullDatabase, isFullPage } from "@notionhq/client";
import { routes } from "@scibly/routes";

const CONTAINER_BLOCK_TYPES = new Set([
  "column_list",
  "column",
  "synced_block",
  "template",
]);

export function extractNotionPageTitle(
  properties: PageObjectResponse["properties"],
): string {
  for (const prop of Object.values(properties)) {
    if (prop.type !== "title") continue;
    return prop.title.map((item) => item.plain_text).join("") || "Untitled";
  }
  return "Untitled";
}

export function extractNotionPageIcon(
  icon: PageObjectResponse["icon"],
): string | undefined {
  if (!icon) return undefined;
  if (icon.type === "emoji") return icon.emoji;
  if (icon.type === "external") return icon.external.url;
  if (icon.type === "file") return icon.file.url;
  return undefined;
}

async function paginateNotion<T>(
  fetcher: (cursor?: string) => Promise<{
    results: T[];
    has_more: boolean;
    next_cursor: string | null;
  }>,
  onResult: (item: T) => void | Promise<void>,
): Promise<void> {
  let cursor: string | undefined;
  do {
    const response = await fetcher(cursor);
    for (const item of response.results) await onResult(item);
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);
}

function notionPageUrl(id: string): string {
  return routes.external.integrations.notion.page(id);
}

function blockLastEdited(block: {
  last_edited_time?: string;
}): Date | undefined {
  return block.last_edited_time === undefined
    ? undefined
    : new Date(block.last_edited_time);
}

export async function collectNotionChildPages(
  notion: Client,
  blockId: string,
  depth = 0,
  requestCount = { value: 0 },
  maxRequests = 30,
): Promise<IntegrationPage[]> {
  if (depth > 4 || requestCount.value >= maxRequests) return [];
  const results: IntegrationPage[] = [];
  await paginateNotion(
    (cursor) =>
      notion.blocks.children.list({
        block_id: blockId,
        page_size: 100,
        start_cursor: cursor,
      }),
    async (block) => {
      if (!("type" in block)) return;
      requestCount.value++;
      if (block.type === "child_page") {
        results.push({
          id: block.id,
          title: block.child_page.title || "Untitled",
          url: notionPageUrl(block.id),
          lastEdited: blockLastEdited(block),
        });
        return;
      }
      if (block.type === "child_database") {
        results.push({
          id: block.id,
          title: block.child_database.title || "Untitled database",
          url: notionPageUrl(block.id),
          isDatabase: true,
          lastEdited: blockLastEdited(block),
        });
        return;
      }
      if (
        CONTAINER_BLOCK_TYPES.has(block.type) &&
        "has_children" in block &&
        block.has_children
      ) {
        results.push(
          ...(await collectNotionChildPages(
            notion,
            block.id,
            depth + 1,
            requestCount,
            maxRequests,
          )),
        );
      }
    },
  );
  return results;
}

export async function listNotionDatabasePages(
  notion: Client,
  databaseId: string,
): Promise<IntegrationPage[]> {
  const results: IntegrationPage[] = [];
  const database = await notion.databases.retrieve({
    database_id: databaseId,
  });
  if (!isFullDatabase(database)) {
    throw new Error("Could not retrieve full database information.");
  }
  const dataSource = database.data_sources?.[0];
  if (!dataSource) return [];

  await paginateNotion(
    (cursor) =>
      notion.dataSources.query({
        data_source_id: dataSource.id,
        page_size: 100,
        start_cursor: cursor ?? undefined,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      }),
    (item) => {
      if (item.object !== "page" || !isFullPage(item)) return;
      results.push({
        id: item.id,
        title: extractNotionPageTitle(item.properties),
        url: item.url,
        icon: extractNotionPageIcon(item.icon),
        lastEdited: new Date(item.last_edited_time),
      });
    },
  );
  return results;
}
