import { withRateLimit } from "@scibly/api/rate-limit";
import { db } from "@scibly/db";

import { SOURCE_STATUS } from "@/shared/content/sources/constants";

import { ingestOrRefreshSource } from "../ingestion/ingest-source";

// Retry, upload confirmation, replacement confirmation, page linking and resync
// all trigger the same extraction work, so they share one rate-limit ceiling
// instead of five.
const INGEST_LIMIT = {
  endpoint: "source.ingest",
  maxPerWindow: 30,
  tooManyRequestsMessage:
    "Too many indexing requests. Please try again in a bit.",
} as const;

export function boundedIngest(userId: string, sourceId: string) {
  return withRateLimit(
    {
      db,
      identifier: userId,
      ...INGEST_LIMIT,

      refundIf: (result) => result.status === SOURCE_STATUS.PROCESSING,
    },
    () => ingestOrRefreshSource(sourceId, { actorId: userId }),
  );
}

// A linked batch costs one slot however many pages it carries: the schema caps
// the batch, and a request that linked nothing did no extraction to pay for.
export function boundedLink<T extends { sourceIds: string[] }>(
  userId: string,
  link: () => Promise<T>,
) {
  return withRateLimit(
    {
      db,
      identifier: userId,
      ...INGEST_LIMIT,
      refundIf: (result: T) => result.sourceIds.length === 0,
    },
    link,
  );
}
