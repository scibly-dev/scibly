import { db } from "@scibly/db";

import { resolveOrg } from "@/features/organizations/server";

import { resolveNotebookInOrg } from "./access";

export const UNTITLED_NOTEBOOK = "Untitled Notebook";

export type EnsureNotebookInput = {
  notebookId?: string;
  userId: string;
  orgSlug: string;
  title?: string;
};

type EnsuredNotebook = {
  notebookId: string;

  organizationId: string;
};

export async function ensureNotebook({
  notebookId,
  userId,
  orgSlug,
  title,
}: EnsureNotebookInput): Promise<EnsuredNotebook> {
  if (notebookId) {
    const { notebook } = await resolveNotebookInOrg(
      notebookId,
      userId,
      orgSlug,
    );

    if (title && notebook.title === UNTITLED_NOTEBOOK) {
      await db.notebook.update({
        where: { id: notebook.id },
        data: { title },
      });
    }

    return { notebookId: notebook.id, organizationId: notebook.organizationId };
  }

  const { organization } = await resolveOrg(orgSlug, userId);
  const notebook = await db.notebook.create({
    data: {
      title: title ?? UNTITLED_NOTEBOOK,
      organizationId: organization.id,
      userId,
    },
  });

  return { notebookId: notebook.id, organizationId: organization.id };
}
