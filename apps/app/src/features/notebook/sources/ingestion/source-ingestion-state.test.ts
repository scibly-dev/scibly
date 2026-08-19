import { describe, expect, it } from "vitest";

import {
  isSourceProcessingLeaseStale,
  SOURCE_INGESTION_LEASE_MS,
} from "./source-ingestion-state";

/**
 * Seam: the pure predicate, with `now` injected rather than the clock doubled.
 */

const NOW = new Date("2026-07-27T12:00:00.000Z").getTime();

function startedAgo(ms: number): Date {
  return new Date(NOW - ms);
}

describe("SL3: when a processing lease may be taken over", () => {
  it.each([
    {
      name: "no run has ever claimed the source",
      startedAt: null,
      stale: false,
    },
    {
      name: "a run claimed it a second ago",
      startedAt: startedAgo(1_000),
      stale: false,
    },
    {
      name: "a run claimed it exactly five minutes ago",

      startedAt: startedAgo(SOURCE_INGESTION_LEASE_MS),
      stale: false,
    },
    {
      name: "a run claimed it a millisecond past five minutes ago",
      startedAt: startedAgo(SOURCE_INGESTION_LEASE_MS + 1),
      stale: true,
    },
    {
      name: "a run claimed it an hour ago",
      startedAt: startedAgo(60 * 60 * 1000),
      stale: true,
    },
  ])("$name: stale = $stale", ({ startedAt, stale }) => {
    expect(isSourceProcessingLeaseStale(startedAt, NOW)).toBe(stale);
  });
});
