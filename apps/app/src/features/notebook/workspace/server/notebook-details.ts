import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { NOTEBOOK_MESSAGE_UI_PAGE_SIZE } from "@/features/notebook/chat/notebook-message-cursor";
import { resolveOrg } from "@/features/organizations/server";
import {
  NOTEBOOK_MESSAGE_NEWEST_FIRST_ORDER,
  sortNotebookMessageTimeline,
} from "@/shared/ai/chat/message-order";

import { assertNotebookOwner } from "./access";

function requireNotebook<T>(notebook: T | null): T {
  if (!notebook) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Notebook not found.",
    });
  }
  return notebook;
}

export async function getNotebookDetailInOrg(
  notebookId: string,
  userId: string,
  orgSlug: string,
) {
  const { organization } = await resolveOrg(orgSlug, userId);
  const notebook = requireNotebook(
    await db.notebook.findUnique({
      where: { id: notebookId },

      omit: { chatSummary: true, chatSummaryThroughMessageId: true },
      include: {
        organization: true,
        course: true,
        chats: {
          orderBy: NOTEBOOK_MESSAGE_NEWEST_FIRST_ORDER,
          take: NOTEBOOK_MESSAGE_UI_PAGE_SIZE + 1,
          select: { id: true, role: true, parts: true, createdAt: true },
        },
      },
    }),
  );
  assertNotebookOwner(notebook, userId, organization.id);

  const { chats: storedMessages, ...detail } = notebook;
  return {
    ...detail,
    messages: sortNotebookMessageTimeline(
      storedMessages.slice(0, NOTEBOOK_MESSAGE_UI_PAGE_SIZE),
    ),
    hasOlderMessages: storedMessages.length > NOTEBOOK_MESSAGE_UI_PAGE_SIZE,
  };
}

export async function getNotebookMetaInOrg(
  notebookId: string,
  userId: string,
  orgSlug: string,
) {
  const { organization } = await resolveOrg(orgSlug, userId);
  const notebook = requireNotebook(
    await db.notebook.findUnique({
      where: { id: notebookId },
      select: {
        id: true,
        title: true,
        courseId: true,
        organizationId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: { id: true, title: true },
        },
      },
    }),
  );
  assertNotebookOwner(notebook, userId, organization.id);
  return notebook;
}
