import type { SourceStatus } from "@/shared/content/sources/constants";

export const SOURCE_INGESTION_LEASE_MS = 5 * 60 * 1000;

export interface SourceIngestionResult {
  sourceId: string;

  status: SourceStatus;
  success: boolean;
  error?: string;
  previousHash?: string | null;
  newHash?: string;
  hashChanged?: boolean;
}

export function isSourceProcessingLeaseStale(
  processingStartedAt: Date | null,
  now = Date.now(),
): boolean {
  return Boolean(
    processingStartedAt &&
    now - processingStartedAt.getTime() > SOURCE_INGESTION_LEASE_MS,
  );
}
