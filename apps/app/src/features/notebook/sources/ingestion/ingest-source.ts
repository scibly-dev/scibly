import type { SourceIngestionResult } from "./source-ingestion-state";

import { AppError, hasAppErrorCode } from "@scibly/api/application-error";
import { type GenerationCharge } from "@scibly/api/entitlement";
import { db } from "@scibly/db";

import { fundGeneration } from "@/features/organizations/server";
import { SOURCE_STATUS } from "@/shared/content/sources/constants";
import { sanitizeSourceTextForIndexing } from "@/shared/content/sources/sanitize-source-text";
import { truncateSourceText } from "@/shared/content/sources/word-count";

import { computeContentHash } from "./content-hash";
import { getSourceExtractor, type SourceExtractor } from "./extractors";
import { runsOwnTextModel } from "./ingest-funding";
import { generateSourceDigest } from "./source-digest";
import {
  claimSourceIngestion,
  deferIngestion,
  persistIngestedSource,
  readySourceFields,
  recordIngestionFailure,
  type SourceIngestionClaim,
  writeUnderClaim,
} from "./source-ingestion-persistence";

export {
  isSourceProcessingLeaseStale,
  SOURCE_INGESTION_LEASE_MS,
  type SourceIngestionResult,
} from "./source-ingestion-state";

async function loadIngestionSource(sourceId: string) {
  return db.notebookSource.findUniqueOrThrow({
    where: { id: sourceId },

    omit: { content: true },
    include: {
      notebook: {
        select: {
          organizationId: true,
          organization: { select: { slug: true } },
        },
      },
    },
  });
}

export type IngestionSource = Awaited<ReturnType<typeof loadIngestionSource>>;
export type { SourceExtractor };

function unchangedResult(
  sourceId: string,
  hash: string,
): SourceIngestionResult {
  return {
    sourceId,
    status: SOURCE_STATUS.READY,
    success: true,
    previousHash: hash,
    newHash: hash,
    hashChanged: false,
  };
}

function claimLostResult(sourceId: string): SourceIngestionResult {
  return {
    sourceId,
    status: SOURCE_STATUS.PROCESSING,
    success: false,
    error: "A newer ingestion took over.",
  };
}

// Both checks must fall through together, or a re-sync after a failed digest
// finds the content unchanged, writes nothing, and leaves the notebook stuck
// in Tier 2 forever.
function derivedColumnsMissing(source: IngestionSource): boolean {
  return (
    source.tokenCount === 0 ||
    (source.summary === null && source.outline === null)
  );
}

async function skipUnchangedRevision(
  claim: SourceIngestionClaim,
  source: IngestionSource,
  extractor: SourceExtractor,
  forceRebuild: boolean,
): Promise<SourceIngestionResult | undefined> {
  const previousHash = source.contentHash;
  if (
    forceRebuild ||
    derivedColumnsMissing(source) ||
    !extractor.isIntegration ||
    previousHash === null ||
    !source.lastSyncedAt ||
    !source.externalId
  ) {
    return undefined;
  }
  try {
    const revision = await extractor.getRevision?.(source);
    if (
      !revision ||
      revision.lastEdited.getTime() > source.lastSyncedAt.getTime()
    ) {
      return undefined;
    }
    const updatedName = resolveUpdatedSourceName(source.name, revision.title);
    const stillOurs = await writeUnderClaim(claim, {
      ...readySourceFields,

      lastSyncedAt: revision.lastEdited,
      name: updatedName,
    });
    if (!stillOurs) return claimLostResult(source.id);
    return unchangedResult(source.id, previousHash);
  } catch (error) {
    console.warn(
      `[SourceIngestion] Revision check failed for ${source.id}; fetching content instead:`,
      error,
    );
    return undefined;
  }
}

function noExtractableText() {
  return new AppError({
    code: "BAD_REQUEST",
    applicationCode: "source.no_extractable_text",
    message: "No text could be extracted from the source.",
  });
}

async function extractSource(
  source: IngestionSource,
  extractor: SourceExtractor,
) {
  const extracted = await extractor.extract(source);
  const sanitizedText = sanitizeSourceTextForIndexing(extracted.text);
  if (!sanitizedText.trim()) {
    throw noExtractableText();
  }
  const { text: processedText, warning } = truncateSourceText(sanitizedText);
  if (!processedText.trim()) {
    throw noExtractableText();
  }
  return {
    extracted,
    processedText,
    warning,
    newHash: computeContentHash(processedText),
    updatedName: resolveUpdatedSourceName(source.name, extracted.title),
  };
}

export type ExtractedSource = Awaited<ReturnType<typeof extractSource>>;

async function skipUnchangedContent(
  claim: SourceIngestionClaim,
  source: IngestionSource,
  extractor: SourceExtractor,
  content: ExtractedSource,
  forceRebuild: boolean,
): Promise<SourceIngestionResult | undefined> {
  if (
    forceRebuild ||
    derivedColumnsMissing(source) ||
    source.contentHash === null ||
    source.contentHash !== content.newHash
  ) {
    return undefined;
  }
  const stillOurs = await writeUnderClaim(claim, {
    ...readySourceFields,
    warning: content.warning,
    lastSyncedAt: extractor.isIntegration
      ? (content.extracted.lastEdited ?? new Date())
      : undefined,
    name: content.updatedName,
  });
  if (!stillOurs) return claimLostResult(source.id);
  return unchangedResult(source.id, source.contentHash);
}

async function sourceHashChanged(
  sourceId: string,
  previousHash: string | null,
  newHash: string,
) {
  if (previousHash) return previousHash !== newHash;
  return (
    (await db.sceneSourceLineage.findFirst({
      where: { sourceId },
      select: { sceneId: true },
    })) !== null
  );
}

class ClaimLostError extends Error {}

async function digestAndPersistUnderCharge(
  claim: SourceIngestionClaim,
  source: IngestionSource,
  extractor: SourceExtractor,
  content: ExtractedSource,
  actorId: string | null,
): Promise<{ hashChanged: boolean }> {
  const organizationId = source.notebook.organizationId;
  const digestAndPersist = async (charge: GenerationCharge | null) => {
    const digest = await generateSourceDigest(
      content.processedText,
      source.notebook.organization.slug,
    );

    if (!digest.produced) await charge?.refund();
    const hashChanged = await sourceHashChanged(
      source.id,
      source.contentHash,
      content.newHash,
    );
    const persisted = await persistIngestedSource(
      claim,
      source,
      extractor,
      content,
      hashChanged,
      digest,
    );
    if (!persisted) throw new ClaimLostError("Claim lost while persisting.");
    return { hashChanged };
  };

  return fundGeneration(
    {
      db,
      organizationId,
      actorId,
      action: "SOURCE_INGEST",
      notebookId: source.notebookId,

      ownEndpoint: await runsOwnTextModel(db, organizationId),
    },
    digestAndPersist,
  );
}

export type IngestOptions = {
  forceRebuild?: boolean;

  actorId: string | null;
};

export async function ingestOrRefreshSource(
  sourceId: string,
  options: IngestOptions,
): Promise<SourceIngestionResult> {
  const claim = await claimSourceIngestion(sourceId);
  if (!claim) {
    return {
      sourceId,
      status: SOURCE_STATUS.PROCESSING,
      success: false,
      error: "Ingestion already in progress.",
    };
  }
  try {
    const source = await loadIngestionSource(sourceId);
    const extractor = getSourceExtractor(source.type);
    const revisionResult = await skipUnchangedRevision(
      claim,
      source,
      extractor,
      options.forceRebuild ?? false,
    );
    if (revisionResult) return revisionResult;
    const content = await extractSource(source, extractor);
    const contentResult = await skipUnchangedContent(
      claim,
      source,
      extractor,
      content,
      options.forceRebuild ?? false,
    );
    if (contentResult) return contentResult;
    const { hashChanged } = await digestAndPersistUnderCharge(
      claim,
      source,
      extractor,
      content,
      options.actorId,
    );
    return {
      sourceId,
      status: SOURCE_STATUS.READY,
      success: true,
      previousHash: source.contentHash,
      newHash: content.newHash,
      hashChanged,
    };
  } catch (error) {
    if (error instanceof ClaimLostError) return claimLostResult(sourceId);

    if (hasAppErrorCode(error, "PAYMENT_REQUIRED")) {
      return {
        sourceId,
        status: SOURCE_STATUS.PENDING,
        success: false,
        error: await deferIngestion(claim, error),
      };
    }
    const errorMessage = await recordIngestionFailure(claim, error);
    return {
      sourceId,
      status: SOURCE_STATUS.FAILED,
      success: false,
      error: errorMessage,
    };
  }
}

// A title lifted from the document ends up quoted in the system prompt as
// untrusted text, so this caps how much context a title page can spend on
// itself.
const MAX_EXTRACTED_NAME_CHARS = 200;

function resolveUpdatedSourceName(
  currentName: string,
  extractedTitle: string | undefined,
): string | undefined {
  const trimmed = extractedTitle?.trim().slice(0, MAX_EXTRACTED_NAME_CHARS);
  if (!trimmed || trimmed === currentName) return undefined;
  return trimmed;
}
