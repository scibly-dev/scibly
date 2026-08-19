import type { Prisma } from "@scibly/db";
import type {
  ExtractedSource,
  IngestionSource,
  SourceExtractor,
} from "./ingest-source";
import type { SourceDigest } from "./source-digest";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import { invalidateScenesForSource } from "@/features/notebook/sources/server/source-invalidation";
import { estimateTokens } from "@/shared/ai/token-estimate";
import { SOURCE_STATUS } from "@/shared/content/sources/constants";

import { SOURCE_INGESTION_LEASE_MS } from "./source-ingestion-state";

export interface SourceIngestionClaim {
  sourceId: string;
  token: string;
}

export async function claimSourceIngestion(
  sourceId: string,
): Promise<SourceIngestionClaim | null> {
  const token = crypto.randomUUID();
  const claimed = await db.notebookSource.updateMany({
    where: {
      id: sourceId,
      OR: [
        {
          status: {
            in: [
              SOURCE_STATUS.PENDING,
              SOURCE_STATUS.FAILED,
              SOURCE_STATUS.READY,
            ],
          },
        },
        {
          status: SOURCE_STATUS.PROCESSING,
          processingStartedAt: {
            lt: new Date(Date.now() - SOURCE_INGESTION_LEASE_MS),
          },
        },
      ],
    },
    data: {
      status: SOURCE_STATUS.PROCESSING,
      processingStartedAt: new Date(),
      processingToken: token,
      error: null,
      warning: null,
    },
  });

  return claimed.count === 0 ? null : { sourceId, token };
}

// Shared by three write paths (unchanged revision, unchanged content, full
// re-index) so a field added to the lease is added once instead of drifting
// across copies.
export const readySourceFields = {
  status: SOURCE_STATUS.READY,
  error: null,
  processingStartedAt: null,
  processingToken: null,

  staleAt: null,
} satisfies Prisma.NotebookSourceUpdateManyMutationInput;

export async function writeUnderClaim(
  claim: SourceIngestionClaim,
  data: Prisma.NotebookSourceUpdateManyMutationInput,
  tx: Prisma.TransactionClient | typeof db = db,
): Promise<boolean> {
  const written = await tx.notebookSource.updateMany({
    where: {
      id: claim.sourceId,
      status: SOURCE_STATUS.PROCESSING,
      processingToken: claim.token,
    },
    data,
  });
  return written.count > 0;
}

export async function persistIngestedSource(
  claim: SourceIngestionClaim,
  source: IngestionSource,
  extractor: SourceExtractor,
  content: ExtractedSource,
  hashChanged: boolean,
  digest: SourceDigest,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const stillOurs = await writeUnderClaim(
      claim,
      {
        ...readySourceFields,

        content: content.processedText,
        tokenCount: estimateTokens(content.processedText),
        summary: digest.summary,
        outline: digest.outline,
        contentHash: content.newHash,
        pageCount: content.extracted.pageCount,
        warning: content.warning,
        lastSyncedAt: extractor.isIntegration
          ? (content.extracted.lastEdited ?? new Date())
          : undefined,
        name: content.updatedName,
      },
      tx,
    );

    if (!stillOurs) return false;

    if (hashChanged) {
      await invalidateScenesForSource(source.id, tx);
    }
    return true;
  });
}

async function releaseClaim(
  claim: SourceIngestionClaim,
  status: typeof SOURCE_STATUS.FAILED | typeof SOURCE_STATUS.PENDING,
  errorMessage: string,
) {
  await writeUnderClaim(claim, {
    status,
    error: errorMessage,
    warning: null,
    processingStartedAt: null,
    processingToken: null,
  }).catch((statusError) => {
    console.error(
      `[SourceIngestion] Failed to persist ${status} for ${claim.sourceId}:`,
      statusError,
    );
  });
  return errorMessage;
}

// The `error` column is rendered verbatim to the author, so only an
// `AppError` message (the app's marker for user-safe text) may go in it — a
// driver's message can leak S3 keys or connection ids.
const GENERIC_INGESTION_FAILURE =
  "This source could not be imported. Try re-syncing it, or replace the file.";

export async function recordIngestionFailure(
  claim: SourceIngestionClaim,
  error: unknown,
) {
  console.error(`[SourceIngestion] Failed for ${claim.sourceId}:`, error);
  return releaseClaim(
    claim,
    SOURCE_STATUS.FAILED,
    error instanceof AppError ? error.message : GENERIC_INGESTION_FAILURE,
  );
}

export async function deferIngestion(
  claim: SourceIngestionClaim,
  error: unknown,
) {
  const errorMessage =
    error instanceof Error ? error.message : "Ingestion deferred";
  console.warn(
    `[SourceIngestion] Deferred for ${claim.sourceId}:`,
    errorMessage,
  );
  return releaseClaim(claim, SOURCE_STATUS.PENDING, errorMessage);
}
