import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { AppError } from "@scibly/api/application-error";
import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

import { env } from "@/env";
import {
  assertOrgCanAffordIngest,
  createPendingSourceUpload,
  resolveNotebook,
  resolveOwnedNotebookSource,
} from "@/features/notebook/server";
import { invalidateScenesForSource } from "@/features/notebook/sources/server/source-invalidation";
import {
  getExpectedSourceS3KeyOrNull,
  getSourceS3Key,
} from "@/lib/file/constants";
import { s3Client, tryDeleteNotebookSourceFile } from "@/lib/file/s3";
import {
  MAX_FILE_SIZE,
  SOURCE_STATUS,
  SOURCE_UPLOAD_GRANT_TTL_MS,
  type SourceType,
} from "@/shared/content/sources/constants";

import { boundedIngest } from "./bounded-ingest";
import {
  confirmReplaceUploadSchema,
  confirmUploadSchema,
  replaceSourceUploadSchema,
  uploadSourceSchema,
} from "./source.schema";

function assertUploadWithinLimit(
  sourceType: SourceType,
  fileSize: number,
): number {
  const maxSize = MAX_FILE_SIZE[sourceType];
  if (fileSize > maxSize) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: `File size exceeds the ${Math.round(maxSize / 1024 / 1024)}MB limit.`,
    });
  }
  return maxSize;
}

function presignSourceUpload(s3Key: string, maxSize: number) {
  return createPresignedPost(s3Client, {
    Bucket: env.MEDIA_BUCKET_NAME,
    Key: s3Key,
    Conditions: [["content-length-range", 0, maxSize]],
    Expires: SOURCE_UPLOAD_GRANT_TTL_MS / 1000,
  });
}

function resolveExpectedS3KeyOrThrow(
  s3Key: string,
  notebook: { organizationId: string },
  source: { id: string; notebookId: string; name: string },
): string {
  const expectedS3Key = getExpectedSourceS3KeyOrNull(
    s3Key,
    notebook.organizationId,
    source.notebookId,
    source.id,
    source.name,
  );

  if (!expectedS3Key) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "Upload reference does not match the expected file location.",
    });
  }
  return expectedS3Key;
}

export const sourceUploadProcedures = {
  upload: protectedProcedure
    .input(uploadSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const { notebook } = await resolveNotebook(input.notebookId, userId);
      const maxSize = assertUploadWithinLimit(input.sourceType, input.fileSize);

      const { sourceId } = await createPendingSourceUpload({
        notebookId: input.notebookId,
        organizationId: notebook.organizationId,
        actorId: userId,
        name: input.fileName,
        type: input.sourceType,
        fileSize: input.fileSize,
      });
      const s3Key = getSourceS3Key(
        notebook.organizationId,
        input.notebookId,
        sourceId,
        input.fileName,
      );
      const presigned = await presignSourceUpload(s3Key, maxSize);

      return {
        sourceId,
        upload: { url: presigned.url, fields: presigned.fields },
        s3Key,
      };
    }),

  confirmUpload: protectedProcedure
    .input(confirmUploadSchema)
    .mutation(async ({ input, ctx }) => {
      const { source, notebook } = await resolveOwnedNotebookSource(
        input.sourceId,
        ctx.session.user.id,
      );
      const expectedS3Key = resolveExpectedS3KeyOrThrow(
        input.s3Key,
        notebook,
        source,
      );

      await db.notebookSource.update({
        where: { id: source.id },
        data: { url: expectedS3Key },
      });
      const ingestion = await boundedIngest(ctx.session.user.id, source.id);
      return { sourceId: source.id, ingestion };
    }),

  replaceUpload: protectedProcedure
    .input(replaceSourceUploadSchema)
    .mutation(async ({ input, ctx }) => {
      const { source, notebook } = await resolveOwnedNotebookSource(
        input.sourceId,
        ctx.session.user.id,
      );

      if (source.externalId) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "api.bad_request",
          message:
            "Integration sources cannot be replaced via file upload. Use re-sync instead.",
        });
      }

      const maxSize = assertUploadWithinLimit(input.sourceType, input.fileSize);

      await assertOrgCanAffordIngest(db, notebook.organizationId);

      const s3Key = getSourceS3Key(
        notebook.organizationId,
        source.notebookId,
        source.id,
        input.fileName,
      );
      const presigned = await presignSourceUpload(s3Key, maxSize);

      return {
        sourceId: source.id,
        upload: { url: presigned.url, fields: presigned.fields },
        s3Key,
      };
    }),

  confirmReplaceUpload: protectedProcedure
    .input(confirmReplaceUploadSchema)
    .mutation(async ({ input, ctx }) => {
      const { source, notebook } = await resolveOwnedNotebookSource(
        input.sourceId,
        ctx.session.user.id,
      );
      assertUploadWithinLimit(input.sourceType, input.fileSize);

      const expectedS3Key = resolveExpectedS3KeyOrThrow(input.s3Key, notebook, {
        ...source,
        name: input.fileName,
      });

      if (source.url && source.url !== expectedS3Key) {
        await tryDeleteNotebookSourceFile(source.url, "[SourceRouter]");
      }

      await db.notebookSource.update({
        where: { id: source.id },
        data: {
          name: input.fileName,
          type: input.sourceType,
          fileSize: input.fileSize,
          status: SOURCE_STATUS.PENDING,
          error: null,
          warning: null,
          url: expectedS3Key,
          contentHash: null,
          content: null,
        },
      });
      await invalidateScenesForSource(source.id);
      const ingestion = await boundedIngest(ctx.session.user.id, source.id);
      return { sourceId: source.id, ingestion };
    }),
};
