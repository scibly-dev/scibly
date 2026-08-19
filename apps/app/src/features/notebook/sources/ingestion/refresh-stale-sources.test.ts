import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SOURCE_STATUS,
  SOURCE_UPLOAD_GRANT_TTL_MS,
} from "@/shared/content/sources/constants";

const db = vi.hoisted(() => ({ notebookSource: { findMany: vi.fn() } }));
const ingest = vi.hoisted(() => ({ ingestOrRefreshSource: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("./ingest-source", () => ingest);

const { SOURCE_INGESTION_LEASE_MS } = await import("./source-ingestion-state");
const { INGEST_CONCURRENCY } = await import("./map-with-concurrency");
const {
  REFRESH_BATCH_LIMIT,
  refreshStaleCourseSources,
  refreshStaleNotebookSources,
} = await import("./refresh-stale-sources");

const NOW = new Date("2026-08-14T12:00:00.000Z");

function owedArms() {
  const [args] = db.notebookSource.findMany.mock.calls[0];
  const [, owed] = args.where.AND;
  return owed.OR;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ now: NOW });
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  db.notebookSource.findMany.mockResolvedValue([]);
  ingest.ingestOrRefreshSource.mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("which sources an open is owed", () => {
  it("takes the ones the freshness poll marked", async () => {
    await refreshStaleNotebookSources("nb-1");

    expect(owedArms()).toContainEqual({ staleAt: { not: null } });
  });

  it("takes the ones deferred for want of credit, but not one still awaiting its upload", async () => {
    await refreshStaleNotebookSources("nb-1");

    expect(owedArms()).toContainEqual({
      status: SOURCE_STATUS.PENDING,
      NOT: {
        url: null,
        content: null,
        externalId: null,
        createdAt: {
          gt: new Date(NOW.getTime() - SOURCE_UPLOAD_GRANT_TTL_MS),
        },
      },
    });
  });

  it("takes the ones a dead run abandoned, but only past its lease", async () => {
    await refreshStaleNotebookSources("nb-1");

    expect(owedArms()).toContainEqual({
      status: SOURCE_STATUS.PROCESSING,
      processingStartedAt: {
        lt: new Date(NOW.getTime() - SOURCE_INGESTION_LEASE_MS),
      },
    });
  });

  it("takes a bounded batch, leaving the rest to the next open", async () => {
    await refreshStaleNotebookSources("nb-1");

    const [args] = db.notebookSource.findMany.mock.calls[0];
    expect(args.take).toBe(REFRESH_BATCH_LIMIT);
  });

  it.each([
    {
      case: "a notebook, to its own sources",
      open: () => refreshStaleNotebookSources("nb-1"),
      scope: { notebookId: "nb-1" },
    },
    {
      case: "a course, to the sources of the notebooks behind it",
      open: () => refreshStaleCourseSources("course-1"),
      scope: { notebook: { courseId: "course-1" } },
    },
  ])("confines opening $case", async ({ open, scope }) => {
    await open();

    const [args] = db.notebookSource.findMany.mock.calls[0];
    expect(args.where.AND[0]).toEqual(scope);
  });
});

describe("the refresh itself", () => {
  beforeEach(() => {
    db.notebookSource.findMany.mockResolvedValue([
      { id: "src-a" },
      { id: "src-b" },
    ]);
  });

  it("ingests each owed source unattended", async () => {
    await refreshStaleNotebookSources("nb-1");

    expect(ingest.ingestOrRefreshSource).toHaveBeenCalledWith("src-a", {
      actorId: null,
    });
    expect(ingest.ingestOrRefreshSource).toHaveBeenCalledWith("src-b", {
      actorId: null,
    });
  });

  it("resolves only once the last source is done, so the caller can re-read", async () => {
    const finished: string[] = [];
    ingest.ingestOrRefreshSource.mockImplementation(async (id: string) => {
      finished.push(id);
    });

    await refreshStaleNotebookSources("nb-1");

    expect(finished).toEqual(["src-a", "src-b"]);
  });

  it("reports how many it took on, so an open that changed nothing invalidates nothing", async () => {
    await expect(refreshStaleNotebookSources("nb-1")).resolves.toBe(2);

    db.notebookSource.findMany.mockResolvedValue([]);
    await expect(refreshStaleNotebookSources("nb-1")).resolves.toBe(0);
  });

  it("one source that throws does not cost the rest of the notebook", async () => {
    ingest.ingestOrRefreshSource.mockImplementation(async (id: string) => {
      if (id === "src-a") throw new Error("claim could not be written");
      return { success: true };
    });

    await refreshStaleNotebookSources("nb-1");

    expect(ingest.ingestOrRefreshSource).toHaveBeenCalledWith("src-b", {
      actorId: null,
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("src-a"),
      expect.any(Error),
    );
  });

  it("keeps a few ingests in flight at once, and no more", async () => {
    db.notebookSource.findMany.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({ id: `src-${i}` })),
    );
    let inFlight = 0;
    let peak = 0;
    ingest.ingestOrRefreshSource.mockImplementation(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return { success: true };
    });

    await refreshStaleNotebookSources("nb-1");

    expect(ingest.ingestOrRefreshSource).toHaveBeenCalledTimes(12);
    expect(peak).toBe(INGEST_CONCURRENCY);
  });

  it("asks for nothing when nothing is owed", async () => {
    db.notebookSource.findMany.mockResolvedValue([]);

    await refreshStaleNotebookSources("nb-1");

    expect(ingest.ingestOrRefreshSource).not.toHaveBeenCalled();
  });
});
