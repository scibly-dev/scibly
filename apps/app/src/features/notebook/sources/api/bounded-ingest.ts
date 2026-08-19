import { withRateLimit } from "@scibly/api/rate-limit";
import { db } from "@scibly/db";

import { ingestOrRefreshSource } from "@/features/notebook/server";
import { SOURCE_STATUS } from "@/shared/content/sources/constants";

// Retry, upload confirmation, and replacement confirmation all trigger the same extraction work, so they share one rate-limit ceiling instead of three.
export function boundedIngest(userId: string, sourceId: string) {
  return withRateLimit(
    {
      db,
      identifier: userId,
      endpoint: "source.ingest",
      maxPerWindow: 30,
      tooManyRequestsMessage:
        "Too many indexing requests. Please try again in a bit.",

      refundIf: (result) => result.status === SOURCE_STATUS.PROCESSING,
    },
    () => ingestOrRefreshSource(sourceId, { actorId: userId }),
  );
}
