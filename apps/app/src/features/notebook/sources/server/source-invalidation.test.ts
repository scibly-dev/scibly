import { beforeEach, describe, expect, it, vi } from "vitest";

// Writes that ride the ingest's own transaction are covered in
// ../ingestion/ingest-source.test.ts.

const db = vi.hoisted(() => ({
  scene: { updateMany: vi.fn() },
}));

vi.mock("@scibly/db", () => ({ db }));

const { flagScenesForSourceRemoval, invalidateScenesForSource } =
  await import("./source-invalidation");

const SOURCE_ID = "src-1";

function statement() {
  return db.scene.updateMany.mock.calls[0]?.[0] ?? {};
}

beforeEach(() => {
  vi.clearAllMocks();
  db.scene.updateMany.mockResolvedValue({ count: 0 });
});

describe("a source whose content genuinely changed", () => {
  it("marks every draft scene grounded in it outdated, in one statement", async () => {
    await invalidateScenesForSource(SOURCE_ID);

    expect(db.scene.updateMany).toHaveBeenCalledTimes(1);

    expect(statement().where).toEqual({
      courseVersionId: null,
      sourceLineages: { some: { sourceId: SOURCE_ID } },
    });
    expect(statement().data).toEqual({
      isOutdated: true,
      outdatedReason: "SOURCE_CHANGED",
    });
  });
});

describe("the scene is the author's document", () => {
  it("touches nothing but the flag and its reason", async () => {
    await invalidateScenesForSource(SOURCE_ID);

    expect(Object.keys(statement().data).sort()).toEqual([
      "isOutdated",
      "outdatedReason",
    ]);
  });
});

describe("scenes in a frozen course version", () => {
  it("are out of the statement's reach entirely", async () => {
    await invalidateScenesForSource(SOURCE_ID);

    expect(statement().where.courseVersionId).toBeNull();
  });
});

describe("a source about to be deleted", () => {
  it("flags its dependent draft scenes as having lost their grounding", async () => {
    await flagScenesForSourceRemoval(SOURCE_ID);

    expect(statement().data).toEqual({
      isOutdated: true,
      outdatedReason: "SOURCE_REMOVED",
    });
  });

  it("matches through the lineage, so it has to run while the source still exists", async () => {
    await flagScenesForSourceRemoval(SOURCE_ID);

    expect(statement().where.sourceLineages).toEqual({
      some: { sourceId: SOURCE_ID },
    });
  });
});
