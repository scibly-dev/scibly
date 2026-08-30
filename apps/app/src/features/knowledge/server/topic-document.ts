import type { TopicLanguage } from "../contracts";

import { createHash } from "node:crypto";

import { APIErrorCode, isNotionClientError } from "@notionhq/client";
import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";
import { routes } from "@scibly/routes";

import { resolvePageConnection } from "@/features/integrations/server";

// The Notion API cannot create a page at the workspace root, so every
// document is filed under one page an admin granted us.
const DESTINATION_PAGE_TITLE = "Scibly Knowledge";

const SKELETON_SECTIONS = {
  en: [
    "Overview",
    "Decisions & rationale",
    "Constraints & gotchas",
    "How it works",
    "Changelog",
  ],
  de: [
    "Überblick",
    "Entscheidungen & Begründung",
    "Einschränkungen & Fallstricke",
    "Wie es funktioniert",
    "Änderungsprotokoll",
  ],
} satisfies Record<TopicLanguage, string[]>;

export function topicSkeleton(language: TopicLanguage): string {
  return `${SKELETON_SECTIONS[language].map((section) => `## ${section}`).join("\n\n")}\n`;
}

type PublishedColumns = {
  notionPageId: string;
  notionRevisionAt: Date;
  documentHash: string;
  publishedAt: Date;
  verifiedAt: Date;
  externallyEditedAt: null;
};

export type TopicDocumentResult =
  | { outcome: "published"; columns: PublishedColumns }
  | {
      outcome: "externallyEdited";
      columns: { externallyEditedAt: Date; verifiedAt: Date };
    }
  | { outcome: "noDocument"; columns: Record<string, never> };

const WRITE_DENIED = new Set<string>([
  APIErrorCode.RestrictedResource,
  APIErrorCode.Unauthorized,
]);

async function notionWrite<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isNotionClientError(error) && WRITE_DENIED.has(error.code)) {
      throw new AppError({
        code: "FORBIDDEN",
        applicationCode: "knowledge.notion_write_denied",
        message:
          "This Notion connection may not write. Reconnect Notion and allow Scibly to insert and update content.",
        cause: error,
      });
    }
    throw error;
  }
}

type NotionConnection = Awaited<ReturnType<typeof resolvePageConnection>>;

// A Notion hiccup must not take the Knowledge page down, hence the null.
async function readDestinationParent(
  { provider, token }: NotionConnection,
  destinationPageId: string,
) {
  try {
    const parentPageId = await provider.getParentPageId(
      token,
      destinationPageId,
    );
    if (!parentPageId) return null;
    const parent = await provider.getPageRevision(token, parentPageId);
    return {
      title: parent?.title ?? DESTINATION_PAGE_TITLE,
      url: routes.external.integrations.notion.page(parentPageId),
    };
  } catch {
    return null;
  }
}

export async function readDocumentDestination(organizationId: string) {
  const notion = await resolvePageConnection(organizationId, "NOTION").catch(
    () => null,
  );
  if (!notion) {
    return { connected: false, destinationPageId: null, parent: null };
  }
  const destinationPageId = notion.connection.knowledgeDestinationPageId;
  return {
    connected: true,
    destinationPageId,
    parent: destinationPageId
      ? await readDestinationParent(notion, destinationPageId)
      : null,
  };
}

// Moved rather than re-created: a second root page would strand every document under the first.
export async function setDocumentDestination(
  organizationId: string,
  parentPageId: string,
): Promise<{ destinationPageId: string }> {
  const { provider, token, connection } = await resolvePageConnection(
    organizationId,
    "NOTION",
  );
  const destinationPageId = connection.knowledgeDestinationPageId;

  if (
    destinationPageId &&
    (await provider.getPageRevision(token, destinationPageId))
  ) {
    await notionWrite(() =>
      provider.movePage(token, destinationPageId, parentPageId),
    );
    return { destinationPageId };
  }

  const page = await notionWrite(() =>
    provider.createPage(token, {
      parentPageId,
      title: DESTINATION_PAGE_TITLE,
    }),
  );
  await db.integrationConnection.update({
    where: { id: connection.id },
    data: { knowledgeDestinationPageId: page.id },
  });
  return { destinationPageId: page.id };
}

// ponytail: Notion truncates `last_edited_time` to the minute, so an outside
// edit landing in the same minute as ours goes unseen. Compare the page's
// markdown instead if that ever costs someone their words.
async function isOurs(
  provider: NotionConnection["provider"],
  token: string,
  pageId: string,
  lastWrote: Date | null,
): Promise<boolean> {
  const revision = await provider.getPageRevision(token, pageId);
  return (
    revision !== null &&
    lastWrote !== null &&
    revision.lastEdited.getTime() === lastWrote.getTime()
  );
}

function publishedColumns(
  pageId: string,
  revision: Date,
  markdown: string,
  now: Date,
): PublishedColumns {
  return {
    notionPageId: pageId,
    notionRevisionAt: revision,
    documentHash: createHash("sha256").update(markdown).digest("hex"),
    publishedAt: now,
    verifiedAt: now,
    externallyEditedAt: null,
  };
}

export async function createTopicDocument({
  organizationId,
  title,
  markdown,
}: {
  organizationId: string;
  title: string;
  markdown: string;
}): Promise<Extract<TopicDocumentResult, { outcome: "published" }>> {
  const { provider, token, connection } = await resolvePageConnection(
    organizationId,
    "NOTION",
  );
  const destinationPageId = connection.knowledgeDestinationPageId;
  if (!destinationPageId) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "knowledge.notion_destination_missing",
      message:
        "Pick where Scibly Knowledge should live in Notion before creating a topic.",
    });
  }
  const page = await notionWrite(() =>
    provider.createPage(token, {
      parentPageId: destinationPageId,
      title,
      markdown,
    }),
  );
  return {
    outcome: "published",
    columns: publishedColumns(page.id, page.revision, markdown, new Date()),
  };
}

export async function republishTopicDocument({
  organizationId,
  topic,
  title,
  markdown,
}: {
  organizationId: string;
  topic: { notionPageId: string | null; notionRevisionAt: Date | null };
  title: string;
  markdown: string;
}): Promise<TopicDocumentResult> {
  const pageId = topic.notionPageId;
  if (!pageId) return { outcome: "noDocument", columns: {} };

  const { provider, token } = await resolvePageConnection(
    organizationId,
    "NOTION",
  );
  const now = new Date();

  if (!(await isOurs(provider, token, pageId, topic.notionRevisionAt))) {
    return {
      outcome: "externallyEdited",
      columns: { externallyEditedAt: now, verifiedAt: now },
    };
  }

  const { revision } = await notionWrite(() =>
    provider.writePage(token, pageId, { title, markdown }),
  );
  return {
    outcome: "published",
    columns: publishedColumns(pageId, revision, markdown, now),
  };
}
