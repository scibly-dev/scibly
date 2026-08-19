import type { NotebookSource } from "@scibly/db/client";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { flagScenesForSourceRemoval } from "@/features/notebook/sources/server/source-invalidation";
import { resolveNotebook } from "@/features/notebook/workspace/server/access";
import { tryDeleteNotebookSourceFile } from "@/lib/file/s3";
import {
  MAX_WORDS_PER_SOURCE,
  SOURCE_STATUS,
  SOURCE_TYPES,
  type SourceType,
} from "@/shared/content/sources/constants";
import { countWords } from "@/shared/content/sources/word-count";

import { assertCanAddSources } from "../ingestion/ingest-funding";
import {
  ingestOrRefreshSource,
  type SourceIngestionResult,
} from "../ingestion/ingest-source";
import {
  INGEST_CONCURRENCY,
  mapWithConcurrency,
} from "../ingestion/map-with-concurrency";

const PROVIDER_PAGE_TYPE = {
  NOTION: SOURCE_TYPES.NOTION_PAGE,
} as const satisfies Record<string, SourceType>;

export interface LinkPageInput {
  id: string;
  title: string;
  url: string;
}

export interface NotebookSourceWrite {
  notebookId: string;
  organizationId: string;

  actorId: string | null;
}

export type CreateAndIngestInput = NotebookSourceWrite & {
  name: string;
  type: SourceType;
  content?: string;
  externalId?: string;
  externalUrl?: string;
  integrationId?: string;
  fileSize?: number;
};

function sourceNotFound(): AppError {
  return new AppError({
    code: "NOT_FOUND",
    applicationCode: "api.not_found",
    message: "Source not found.",
  });
}

export async function resolveOwnedNotebookSource(
  sourceId: string,
  userId: string,
): Promise<{
  source: Omit<NotebookSource, "content">;
  notebook: Awaited<ReturnType<typeof resolveNotebook>>["notebook"];
}> {
  const source = await db.notebookSource.findUnique({
    where: { id: sourceId },

    omit: { content: true },
  });

  if (!source) {
    throw sourceNotFound();
  }

  try {
    const { notebook } = await resolveNotebook(source.notebookId, userId);
    return { source, notebook };
  } catch (error) {
    if (
      error instanceof AppError &&
      error.applicationCode === "api.not_found"
    ) {
      throw sourceNotFound();
    }
    throw error;
  }
}

export async function createPendingSourceUpload(
  data: NotebookSourceWrite & {
    name: string;
    type: SourceType;
    fileSize: number;
  },
): Promise<{ sourceId: string }> {
  await assertCanAddSources(db, data);

  const source = await db.notebookSource.create({
    data: {
      notebookId: data.notebookId,
      name: data.name,
      type: data.type,
      status: SOURCE_STATUS.PENDING,
      fileSize: data.fileSize,
    },
  });

  return { sourceId: source.id };
}

async function createAndIngestSource(
  data: CreateAndIngestInput,
): Promise<{ sourceId: string; ingestion: SourceIngestionResult }> {
  await assertCanAddSources(db, data);

  const source = await db.notebookSource.create({
    data: {
      notebookId: data.notebookId,
      name: data.name,
      type: data.type,
      content: data.content ?? null,
      externalId: data.externalId ?? null,
      externalUrl: data.externalUrl ?? null,
      integrationId: data.integrationId ?? null,
      fileSize: data.fileSize ?? 0,
      status: SOURCE_STATUS.PENDING,
    },
  });

  const ingestion = await ingestOrRefreshSource(source.id, {
    actorId: data.actorId,
  });
  return { sourceId: source.id, ingestion };
}

export async function linkNotebookPages(
  input: NotebookSourceWrite & {
    provider: keyof typeof PROVIDER_PAGE_TYPE;
    connectionId: string;
    pages: LinkPageInput[];
  },
): Promise<{
  sourceIds: string[];
  skipped: number;
  ingestions: SourceIngestionResult[];
}> {
  const { notebookId, provider, connectionId, pages, actorId } = input;

  const createdSourceIds = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${notebookId}))`;

    const existingLinks = await tx.notebookSource.findMany({
      where: {
        notebookId,
        integrationId: connectionId,
        externalId: { in: pages.map((page) => page.id) },
      },
      select: { externalId: true },
    });
    const alreadyLinked = new Set(
      existingLinks.map((source) => source.externalId),
    );

    const pagesToAdd = [
      ...new Map(
        pages
          .filter((page) => !alreadyLinked.has(page.id))
          .map((page) => [page.id, page] as const),
      ).values(),
    ];

    if (pagesToAdd.length === 0) return [];

    await assertCanAddSources(tx, {
      organizationId: input.organizationId,
      notebookId,
      count: pagesToAdd.length,
    });

    const created = await tx.notebookSource.createManyAndReturn({
      data: pagesToAdd.map((page) => ({
        notebookId,
        name: page.title,
        type: PROVIDER_PAGE_TYPE[provider],
        externalId: page.id,
        externalUrl: page.url,
        integrationId: connectionId,
        status: SOURCE_STATUS.PENDING,
      })),
      select: { id: true },
      skipDuplicates: true,
    });

    return created.map((source) => source.id);
  });

  const ingestions = await mapWithConcurrency(
    createdSourceIds,
    INGEST_CONCURRENCY,
    (sourceId) => ingestOrRefreshSource(sourceId, { actorId }),
  );

  return {
    sourceIds: createdSourceIds,
    skipped: pages.length - createdSourceIds.length,
    ingestions,
  };
}

export async function deleteNotebookSource(
  sourceId: string,
  s3Url: string | null,
): Promise<void> {
  await flagScenesForSourceRemoval(sourceId);

  await db.notebookSource.delete({ where: { id: sourceId } });

  await tryDeleteNotebookSourceFile(s3Url, "[NotebookSources]");
}

export async function addTextSource(
  input: NotebookSourceWrite & { name: string; content: string },
): Promise<{ sourceId: string; ingestion: SourceIngestionResult }> {
  const wordCount = countWords(input.content);
  if (wordCount > MAX_WORDS_PER_SOURCE) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: `Text sources can contain at most ${MAX_WORDS_PER_SOURCE.toLocaleString()} words (received ${wordCount.toLocaleString()}).`,
    });
  }

  return createAndIngestSource({
    ...input,
    type: SOURCE_TYPES.TEXT,
    fileSize: Buffer.byteLength(input.content, "utf-8"),
  });
}
