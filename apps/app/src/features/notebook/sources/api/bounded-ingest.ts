import { withRateLimit } from "@scibly/api/rate-limit";
import { db } from "@scibly/db";

import { SOURCE_STATUS } from "@/shared/content/sources/constants";

import { ingestOrRefreshSource } from "../ingestion/ingest-source";

// Five entry points trigger the same extraction work, so they share one ceiling.
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

// A linked batch costs one slot however many pages it carries.
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
