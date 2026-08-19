import { AppError } from "@scibly/api/application-error";
import { protectedProcedure } from "@scibly/api/trpc";

import {
  ingestOrRefreshSource,
  linkNotebookPages,
  resolveNotebook,
  resolveOwnedNotebookSource,
} from "@/features/notebook/server";
import { resolveOrg } from "@/features/organizations/server";

import {
  linkPageSchema,
  linkPagesSchema,
  resyncSourceSchema,
} from "./integration.schema";
import { resolveConnection } from "./integration-connection-procedures";

async function resolveLinkedNotebook(
  orgSlug: string,
  notebookId: string,
  userId: string,
) {
  const [{ organization }, { notebook }] = await Promise.all([
    resolveOrg(orgSlug, userId, "admin_or_owner"),
    resolveNotebook(notebookId, userId),
  ]);
  if (notebook.organizationId !== organization.id) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Notebook not found.",
    });
  }
  return { organization, notebook };
}

export const integrationPageProcedures = {
  linkPages: protectedProcedure
    .input(linkPagesSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const { organization } = await resolveLinkedNotebook(
        input.orgSlug,
        input.notebookId,
        userId,
      );
      const { connection } = await resolveConnection(
        organization.id,
        input.provider,
      );
      const { sourceIds, skipped } = await linkNotebookPages({
        notebookId: input.notebookId,
        organizationId: organization.id,
        actorId: userId,
        provider: input.provider,
        connectionId: connection.id,
        pages: input.pages,
      });
      return { sourceIds, skipped };
    }),

  linkPage: protectedProcedure
    .input(linkPageSchema)
    .mutation(async ({ input, ctx }) => {
      const { organization } = await resolveLinkedNotebook(
        input.orgSlug,
        input.notebookId,
        ctx.session.user.id,
      );
      const { connection } = await resolveConnection(
        organization.id,
        input.provider,
      );
      const result = await linkNotebookPages({
        notebookId: input.notebookId,
        organizationId: organization.id,
        actorId: ctx.session.user.id,
        provider: input.provider,
        connectionId: connection.id,
        pages: [
          {
            id: input.pageId,
            title: input.pageTitle,
            url: input.pageUrl,
          },
        ],
      });
      const sourceId = result.sourceIds[0];
      const ingestion = result.ingestions[0];
      if (!sourceId || !ingestion) {
        throw new AppError({
          code: "CONFLICT",
          applicationCode: "api.conflict",
          message: "This page is already linked to this notebook.",
        });
      }
      return { sourceId, ingestion };
    }),

  resyncSource: protectedProcedure
    .input(resyncSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const { source } = await resolveOwnedNotebookSource(
        input.sourceId,
        userId,
      );
      await resolveLinkedNotebook(input.orgSlug, source.notebookId, userId);
      if (!source.externalId) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "api.bad_request",
          message: "This source is not an external integration source.",
        });
      }
      if (!source.integrationId) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "api.bad_request",
          message:
            "This source's integration was disconnected. Reconnect the integration and re-link the page to resume syncing.",
        });
      }
      const ingestion = await ingestOrRefreshSource(source.id, {
        actorId: userId,
      });
      return { sourceId: source.id, ingestion };
    }),
};
