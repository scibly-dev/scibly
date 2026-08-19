import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

import {
  ensureNotebook,
  getNotebookDetailInOrg,
  getNotebookMetaInOrg,
  listOlderNotebookMessages,
  resolveNotebookInOrg,
} from "@/features/notebook/server";
import { resolveOrg } from "@/features/organizations/server";

import { generatedImageRouter } from "../media/api/generated-image.router";
import { sourceRouter } from "../sources/api/source.router";
import {
  deleteNotebookSchema,
  ensureNotebookSchema,
  getNotebookSchema,
  listNotebooksSchema,
  listOlderNotebookMessagesSchema,
  updateNotebookSchema,
} from "./notebook.schema";

export const notebookRouter = createTRPCRouter({
  source: sourceRouter,
  generatedImage: generatedImageRouter,

  list: protectedProcedure
    .input(listNotebooksSchema)
    .query(async ({ input, ctx }) => {
      const { organization } = await resolveOrg(
        input.orgSlug,
        ctx.session.user.id,
      );

      return db.notebook.findMany({
        where: {
          organizationId: organization.id,
          userId: ctx.session.user.id,
        },
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(getNotebookSchema)
    .query(({ input, ctx }) =>
      getNotebookDetailInOrg(
        input.notebookId,
        ctx.session.user.id,
        input.orgSlug,
      ),
    ),

  listOlderMessages: protectedProcedure
    .input(listOlderNotebookMessagesSchema)
    .query(async ({ input, ctx }) => {
      await resolveNotebookInOrg(
        input.notebookId,
        ctx.session.user.id,
        input.orgSlug,
      );

      const { items, nextOlderCursor } = await listOlderNotebookMessages(
        input.notebookId,
        input.beforeCursor,
        input.limit,
      );

      return {
        items: items.map((row) => ({
          id: row.id,
          role: row.role,
          parts: row.parts,
          createdAt: row.createdAt,
        })),
        nextOlderCursor,
      };
    }),

  getMeta: protectedProcedure
    .input(getNotebookSchema)
    .query(({ input, ctx }) =>
      getNotebookMetaInOrg(
        input.notebookId,
        ctx.session.user.id,
        input.orgSlug,
      ),
    ),

  ensure: protectedProcedure
    .input(ensureNotebookSchema)
    .mutation(async ({ input, ctx }) => {
      const ensured = await ensureNotebook({
        ...input,
        userId: ctx.session.user.id,
      });
      return { id: ensured.notebookId };
    }),

  update: protectedProcedure
    .input(updateNotebookSchema)
    .mutation(async ({ input, ctx }) => {
      const { notebook } = await resolveNotebookInOrg(
        input.notebookId,
        ctx.session.user.id,
        input.orgSlug,
      );

      return db.notebook.update({
        where: { id: notebook.id },
        data: { title: input.title },
        omit: { chatSummary: true, chatSummaryThroughMessageId: true },
      });
    }),

  delete: protectedProcedure
    .input(deleteNotebookSchema)
    .mutation(async ({ input, ctx }) => {
      const { notebook } = await resolveNotebookInOrg(
        input.notebookId,
        ctx.session.user.id,
        input.orgSlug,
      );

      await db.notebook.delete({ where: { id: notebook.id } });

      return { ok: true as const };
    }),
});
