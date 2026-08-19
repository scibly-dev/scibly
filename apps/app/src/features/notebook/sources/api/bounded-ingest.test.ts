import type { SourceIngestionResult } from "../ingestion/source-ingestion-state";

import { rateLimitCounter } from "@test/mocks/rate-limit-counter";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SOURCE_STATUS } from "@/shared/content/sources/constants";

// The rate limit table is doubled but `withRateLimit` runs for real, so cost decisions come from the `refundIf` predicate under test, not a mocked limiter.
const db = vi.hoisted(() => ({
  rateLimit: { updateMany: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
}));

const ingestion = vi.hoisted(() => ({ ingestOrRefreshSource: vi.fn() }));

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  db,
}));
vi.mock("@/features/notebook/server", () => ingestion);

const { boundedIngest } = await import("./bounded-ingest");

const AUTHOR = "user-author";
const SOURCE = "src-syllabus";
const ENDPOINT = "source.ingest";
const HOURLY_SLOTS = 30;

const live = rateLimitCounter();

function ingestReturns(result: SourceIngestionResult) {
  ingestion.ingestOrRefreshSource.mockResolvedValue(result);
}

const spent = () => live.spent(AUTHOR, ENDPOINT);

beforeEach(() => {
  vi.clearAllMocks();
  live.clear();
  db.rateLimit.updateMany.mockImplementation(live.model.updateMany);
  db.rateLimit.create.mockImplementation(live.model.create);
  db.rateLimit.findUnique.mockImplementation(live.model.findUnique);
});

describe("what an indexing request costs its author", () => {
  it("B1: a run that indexed the source spends a slot", async () => {
    ingestReturns({
      sourceId: SOURCE,
      status: SOURCE_STATUS.READY,
      success: true,
      previousHash: "old",
      newHash: "new",
      hashChanged: true,
    });

    await boundedIngest(AUTHOR, SOURCE);

    expect(spent()).toBe(1);
  });

  it("B2: a request that found another run holding the source hands its slot back", async () => {
    ingestReturns({
      sourceId: SOURCE,
      status: SOURCE_STATUS.PROCESSING,
      success: false,
      error: "Ingestion already in progress.",
    });

    await boundedIngest(AUTHOR, SOURCE);

    expect(spent()).toBe(0);
  });

  it("B3: a run that failed after doing the work keeps its charge", async () => {
    ingestReturns({
      sourceId: SOURCE,
      status: SOURCE_STATUS.FAILED,
      success: false,
      error: "The PDF could not be read.",
    });

    await boundedIngest(AUTHOR, SOURCE);

    expect(spent()).toBe(1);
  });

  it("B4: once the hour's slots are gone the request is refused and nothing is indexed", async () => {
    live.setSpent(AUTHOR, ENDPOINT, HOURLY_SLOTS);

    await expect(boundedIngest(AUTHOR, SOURCE)).rejects.toThrow(
      "Too many indexing requests",
    );
    expect(ingestion.ingestOrRefreshSource).not.toHaveBeenCalled();
  });
});
