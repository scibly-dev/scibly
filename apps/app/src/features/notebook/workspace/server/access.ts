import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { requireOrgMember, resolveOrg } from "@/features/organizations/server";

function notebookNotFound(): AppError {
  return new AppError({
    code: "NOT_FOUND",
    applicationCode: "api.not_found",
    message: "Notebook not found.",
  });
}

export function assertNotebookOwner(
  notebook: { userId: string; organizationId: string },
  userId: string,
  organizationId: string,
): void {
  if (notebook.userId !== userId) {
    throw notebookNotFound();
  }

  if (notebook.organizationId !== organizationId) {
    throw notebookNotFound();
  }
}

async function loadNotebookRow(notebookId: string) {
  const notebook = await db.notebook.findUnique({
    where: { id: notebookId },
    include: { organization: true },
  });

  if (!notebook) {
    throw notebookNotFound();
  }

  return notebook;
}

export async function resolveNotebook(notebookId: string, userId: string) {
  const notebook = await loadNotebookRow(notebookId);
  assertNotebookOwner(notebook, userId, notebook.organizationId);
  const membership = await requireOrgMember(
    notebook.organizationId,
    userId,
    "admin_or_owner",
  );

  return { notebook, membership };
}

export async function resolveNotebookInOrg(
  notebookId: string,
  userId: string,
  orgSlug: string,
) {
  const { organization, membership } = await resolveOrg(orgSlug, userId);
  const notebook = await loadNotebookRow(notebookId);
  assertNotebookOwner(notebook, userId, organization.id);
  return { notebook, membership };
}
