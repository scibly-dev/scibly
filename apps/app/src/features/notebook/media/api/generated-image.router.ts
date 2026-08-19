import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";
import { z } from "zod";

import {
  assertGeneratedImageS3KeyInScope,
  getGeneratedImageById,
  listGeneratedImages,
  toPublicListItem,
} from "@/features/notebook/media/server/notebook-generated-image";
import {
  GENERATED_IMAGE_PAGE_SIZE,
  listNotebookMediaInputSchema,
} from "@/features/notebook/media/tools/image-schemas";
import { resolveNotebookInOrg } from "@/features/notebook/server";
import { getPresignedDownloadUrl } from "@/lib/file/s3";
import { buildGeneratedImageFilename } from "@/lib/utils/download-remote-file";

const listGeneratedImagesSchema = z
  .object({
    notebookId: z.string().min(1),
    orgSlug: z.string().min(1),
  })
  .merge(listNotebookMediaInputSchema)
  .extend({
    // eslint-disable-next-line anti-slop/no-shape-in-symbol-names -- Zod's own API for reading an object schema's fields; not a name we chose.
    limit: listNotebookMediaInputSchema.shape.limit
      .optional()
      .default(GENERATED_IMAGE_PAGE_SIZE),
  });

const getGeneratedImageDownloadUrlSchema = z.object({
  id: z.string().min(1),
  notebookId: z.string().min(1),
  orgSlug: z.string().min(1),
  filename: z.string().min(1).max(120).optional(),
});

export const generatedImageRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listGeneratedImagesSchema)
    .query(async ({ input, ctx }) => {
      const { notebook } = await resolveNotebookInOrg(
        input.notebookId,
        ctx.session.user.id,
        input.orgSlug,
      );

      const { items, nextCursor } = await listGeneratedImages(notebook.id, {
        cursor: input.cursor,
        limit: input.limit,
      });

      return {
        items: items.map((row) => toPublicListItem(row)),
        nextCursor,
      };
    }),
  getDownloadUrl: protectedProcedure
    .input(getGeneratedImageDownloadUrlSchema)
    .mutation(async ({ input, ctx }) => {
      const { notebook } = await resolveNotebookInOrg(
        input.notebookId,
        ctx.session.user.id,
        input.orgSlug,
      );

      const row = await getGeneratedImageById(input.id, notebook.id);

      assertGeneratedImageS3KeyInScope(
        row.s3Key,
        notebook.organizationId,
        notebook.id,
      );

      const filename =
        input.filename ??
        buildGeneratedImageFilename(row.alt ?? "generated-image");

      const downloadUrl = await getPresignedDownloadUrl(row.s3Key, {
        filename,
      });

      return { downloadUrl, filename };
    }),
});
