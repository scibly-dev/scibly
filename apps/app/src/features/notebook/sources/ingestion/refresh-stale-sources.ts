import type { Prisma } from "@scibly/db";

import { db } from "@scibly/db";

import {
  SOURCE_STATUS,
  SOURCE_UPLOAD_GRANT_TTL_MS,
} from "@/shared/content/sources/constants";

import { ingestOrRefreshSource } from "./ingest-source";
import { INGEST_CONCURRENCY, mapWithConcurrency } from "./map-with-concurrency";
import { SOURCE_INGESTION_LEASE_MS } from "./source-ingestion-state";

export const REFRESH_BATCH_LIMIT = 25;

// A row still inside its upload grant has no file yet, so claiming it would
// fail a source whose upload is merely in flight; past the grant the upload
// can never land and the row is owed the failure.
function awaitingUpload(): Prisma.NotebookSourceWhereInput {
  return {
    url: null,
    content: null,
    externalId: null,
    createdAt: { gt: new Date(Date.now() - SOURCE_UPLOAD_GRANT_TTL_MS) },
  };
}

// Re-ingestion happens when someone opens what a source belongs to, not on a
// schedule: this covers a page the freshness poll marked stale, one deferred
// for want of credit, and one a run abandoned while holding the claim.
function owedIngestion(): Prisma.NotebookSourceWhereInput {
  return {
    OR: [
      { staleAt: { not: null } },
      { status: SOURCE_STATUS.PENDING, NOT: awaitingUpload() },
      {
        status: SOURCE_STATUS.PROCESSING,
        processingStartedAt: {
          lt: new Date(Date.now() - SOURCE_INGESTION_LEASE_MS),
        },
      },
    ],
  };
}

// The open that asked for it awaits the response, so the reply landing tells
// the client to re-read — nothing else has to watch for a finish the server
// cannot announce — and concurrent opens are safe since the per-source claim
// lets exactly one of them through.
async function refreshOwed(
  scope: Prisma.NotebookSourceWhereInput,
): Promise<number> {
  const owed = await db.notebookSource.findMany({
    where: { AND: [scope, owedIngestion()] },
    select: { id: true },

    take: REFRESH_BATCH_LIMIT,
  });

  await mapWithConcurrency(owed, INGEST_CONCURRENCY, async (source) => {
    try {
      await ingestOrRefreshSource(source.id, { actorId: null });
    } catch (error) {
      console.error(
        `[SourceRefresh] Refresh threw for source ${source.id}:`,
        error,
      );
    }
  });

  return owed.length;
}

export function refreshStaleNotebookSources(
  notebookId: string,
): Promise<number> {
  return refreshOwed({ notebookId });
}

export function refreshStaleCourseSources(courseId: string): Promise<number> {
  return refreshOwed({ notebook: { courseId } });
}
