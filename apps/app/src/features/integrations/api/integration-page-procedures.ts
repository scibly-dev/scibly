import { AppError } from "@scibly/api/application-error";
import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

import {
  boundedIngest,
  boundedLink,
  linkNotebookPages,
  resolveNotebook,
  resolveOwnedNotebookSource,
} from "@/features/notebook/server";
import { resolveOrg } from "@/features/organizations/server";

import { isConnected } from "../server/connection-state";
import { linkPagesSchema, resyncSourceSchema } from "./integration.schema";
import { resolveConnectionRow } from "./integration-connection-procedures";

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
      const { connection } = await resolveConnectionRow(
        organization.id,
        input.provider,
      );
      const { sourceIds, skipped } = await boundedLink(userId, () =>
        linkNotebookPages({
          notebookId: input.notebookId,
          organizationId: organization.id,
          actorId: userId,
          provider: input.provider,
          connectionId: connection.id,
          pages: input.pages,
        }),
      );
      return { sourceIds, skipped };
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
      // The link survives a disconnect, so having one is not enough: the connection it points at has to still hold a credential.
      const connection = source.integrationId
        ? await db.integrationConnection.findUnique({
            where: { id: source.integrationId },
            select: { accessTokenEncrypted: true, installationId: true },
          })
        : null;
      if (!connection || !isConnected(connection)) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "api.bad_request",
          message: source.integrationId
            ? "This source's integration is disconnected. Reconnect it to resume syncing."
            : "This source's integration was disconnected. Reconnect the integration and re-link the page to resume syncing.",
        });
      }
      const ingestion = await boundedIngest(userId, source.id);
      return { sourceId: source.id, ingestion };
    }),
};
