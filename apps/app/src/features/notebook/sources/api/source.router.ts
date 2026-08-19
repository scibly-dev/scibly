import { AppError } from "@scibly/api/application-error";
import {
  getUtcBucketStart,
  TimeHelpers,
  withRateLimit,
} from "@scibly/api/rate-limit";
import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

import { requireCourseAdmin } from "@/features/course-authoring/server";
import {
  addTextSource,
  assertOrgCanAffordIngest,
  deleteNotebookSource,
  isSourceProcessingLeaseStale,
  refreshStaleCourseSources,
  refreshStaleNotebookSources,
  resolveNotebook,
  resolveOwnedNotebookSource,
} from "@/features/notebook/server";
import { isNotebookSourceS3KeyInScope } from "@/lib/file/constants";
import { getPresignedDownloadUrl } from "@/lib/file/s3";
import { SOURCE_STATUS } from "@/shared/content/sources/constants";

import {
  readNotebookSource,
  searchNotebookSources,
} from "../server/search-sources";
import { boundedIngest } from "./bounded-ingest";
import {
  addTextSourceSchema,
  deleteSourceSchema,
  failUploadSchema,
  getDownloadUrlSchema,
  listSourcesSchema,
  readSourceSchema,
  refreshStaleCourseSourcesSchema,
  refreshStaleSourcesSchema,
  retryIngestSchema,
  searchSourcesSchema,
} from "./source.schema";
import { sourceUploadProcedures } from "./source-upload-procedures";

// Extraction runs before the charge, so an org that can't pay leaves sources PENDING and owed forever; this bounds how often a client reopening in a loop can re-extract them.
const boundedRefresh = (userId: string, refresh: () => Promise<number>) =>
  withRateLimit(
    {
      db,
      identifier: userId,
      endpoint: "source.refreshStale",
      maxPerWindow: 60,

      refundIf: (refreshed) => refreshed === 0,
    },
    refresh,
    async () => 0,
  );

export const sourceRouter = createTRPCRouter({
  ...sourceUploadProcedures,

  addText: protectedProcedure
    .input(addTextSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const { notebook } = await resolveNotebook(
        input.notebookId,
        ctx.session.user.id,
      );
      return addTextSource({
        notebookId: input.notebookId,
        organizationId: notebook.organizationId,
        actorId: ctx.session.user.id,
        name: input.name,
        content: input.content,
      });
    }),

  list: protectedProcedure
    .input(listSourcesSchema)
    .query(async ({ input, ctx }) => {
      await resolveNotebook(input.notebookId, ctx.session.user.id);

      const sources = await db.notebookSource.findMany({
        where: { notebookId: input.notebookId },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          error: true,
          warning: true,
          fileSize: true,
          pageCount: true,
          url: true,
          createdAt: true,
          externalId: true,
          externalUrl: true,
          lastSyncedAt: true,
          processingStartedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return sources.map((source) => ({
        ...source,
        status: source.status,
        retryable:
          source.status === SOURCE_STATUS.PENDING ||
          source.status === SOURCE_STATUS.FAILED ||
          (source.status === SOURCE_STATUS.PROCESSING &&
            isSourceProcessingLeaseStale(source.processingStartedAt)),
      }));
    }),

  refreshStale: protectedProcedure
    .input(refreshStaleSourcesSchema)
    .mutation(async ({ input, ctx }) => {
      await resolveNotebook(input.notebookId, ctx.session.user.id);
      const refreshed = await boundedRefresh(ctx.session.user.id, () =>
        refreshStaleNotebookSources(input.notebookId),
      );
      return { refreshed };
    }),

  refreshStaleForCourse: protectedProcedure
    .input(refreshStaleCourseSourcesSchema)
    .mutation(async ({ input, ctx }) => {
      await requireCourseAdmin(input.courseId, ctx.session.user.id);
      const refreshed = await boundedRefresh(ctx.session.user.id, () =>
        refreshStaleCourseSources(input.courseId),
      );
      return { refreshed };
    }),

  delete: protectedProcedure
    .input(deleteSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const { source } = await resolveOwnedNotebookSource(
        input.sourceId,
        ctx.session.user.id,
      );
      await deleteNotebookSource(source.id, source.url);
      return { deleted: true };
    }),

  retryIngest: protectedProcedure
    .input(retryIngestSchema)
    .mutation(async ({ input, ctx }) => {
      const { source, notebook } = await resolveOwnedNotebookSource(
        input.sourceId,
        ctx.session.user.id,
      );
      await assertOrgCanAffordIngest(db, notebook.organizationId);
      const ingestion = await boundedIngest(ctx.session.user.id, source.id);
      return { sourceId: source.id, ingestion };
    }),

  failUpload: protectedProcedure
    .input(failUploadSchema)
    .mutation(async ({ input, ctx }) => {
      const { source } = await resolveOwnedNotebookSource(
        input.sourceId,
        ctx.session.user.id,
      );

      await db.notebookSource.update({
        where: { id: source.id },
        data: { status: SOURCE_STATUS.FAILED, error: input.error },
      });

      return { sourceId: source.id };
    }),

  search: protectedProcedure
    .input(searchSourcesSchema)
    .query(async ({ input, ctx }) => {
      await resolveNotebook(input.notebookId, ctx.session.user.id);

      return withRateLimit(
        {
          db,
          identifier: ctx.session.user.id,
          endpoint: "source.search",
          maxPerWindow: 120,
          windowStart: getUtcBucketStart(new Date(), TimeHelpers.IN_MS.MINUTE),
          tooManyRequestsMessage:
            "Too many searches. Please slow down and try again shortly.",
        },
        () => searchNotebookSources(input.notebookId, input.query, input.limit),
      );
    }),

  read: protectedProcedure
    .input(readSourceSchema)
    .query(async ({ input, ctx }) => {
      await resolveNotebook(input.notebookId, ctx.session.user.id);

      return withRateLimit(
        {
          db,
          identifier: ctx.session.user.id,
          endpoint: "source.read",
          maxPerWindow: 120,
          windowStart: getUtcBucketStart(new Date(), TimeHelpers.IN_MS.MINUTE),
          tooManyRequestsMessage:
            "Too many source reads. Please slow down and try again shortly.",
        },
        () =>
          readNotebookSource(input.notebookId, input.sourceId, input.offset),
      );
    }),
  getDownloadUrl: protectedProcedure
    .input(getDownloadUrlSchema)
    .mutation(async ({ input, ctx }) => {
      const { source, notebook } = await resolveOwnedNotebookSource(
        input.sourceId,
        ctx.session.user.id,
      );

      if (!source.url) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "api.bad_request",
          message: "This source has no associated file.",
        });
      }

      if (
        !isNotebookSourceS3KeyInScope(
          source.url,
          notebook.organizationId,
          source.notebookId,
        )
      ) {
        throw new AppError({
          code: "BAD_REQUEST",
          applicationCode: "api.bad_request",
          message: "This source's file reference is invalid.",
        });
      }

      const downloadUrl = await getPresignedDownloadUrl(source.url);

      return { downloadUrl };
    }),
});
