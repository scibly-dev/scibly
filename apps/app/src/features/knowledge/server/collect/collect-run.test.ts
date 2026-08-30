import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  knowledgeCollectionRun: {
    update: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
  knowledgeBundle: { findMany: vi.fn(), upsert: vi.fn() },
}));
const github = vi.hoisted(() => ({
  resolveRepositoryConnection: vi.fn(),
  listMergedPullRequests: vi.fn(),
  fetchPullRequestDetail: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db, Prisma: { DbNull: "DbNull" } }));
vi.mock("@/features/integrations/server", () => github);

const { collectRepository, recordFailedCollection } =
  await import("./collect-run");

const request = {
  runId: "run-1",
  organizationId: "org-1",
  repositoryId: "42",
};

const WATERMARK = new Date("2026-08-01T00:00:00Z");
const TOUCHED = new Date("2026-08-02T00:00:00Z");

const pullRequest = {
  externalId: "PR_1",
  number: 7,
  title: "Give the scheduler a per-account lock",
  authorLogin: "ada",
  authorType: "User",
  labels: ["design"],
  commentCount: 6,
  updatedAt: TOUCHED,
  mergedAt: TOUCHED,
  url: "https://github.com/acme/api/pull/7",
};

const succeededWith = () =>
  db.knowledgeCollectionRun.update.mock.calls.find(
    ([call]) => call.data.status === "SUCCEEDED",
  )?.[0].data;

beforeEach(() => {
  vi.clearAllMocks();
  github.resolveRepositoryConnection.mockResolvedValue({
    token: "ghs_secret",
    provider: { resolveGrant: vi.fn().mockResolvedValue({ name: "acme/api" }) },
  });
  github.listMergedPullRequests.mockResolvedValue({
    pullRequests: [],
    nextCursor: null,
  });
  db.knowledgeCollectionRun.findFirst.mockResolvedValue({
    collectedThrough: WATERMARK,
  });
  db.knowledgeBundle.findMany.mockResolvedValue([]);
});

describe("the watermark advances on success alone", () => {
  it("only ever reads it off a run that succeeded", async () => {
    await collectRepository(request);

    const [{ where }] = db.knowledgeCollectionRun.findFirst.mock.calls[0];
    expect(where.status).toBe("SUCCEEDED");
  });

  it("plants it and collects nothing on the first run", async () => {
    db.knowledgeCollectionRun.findFirst.mockResolvedValue(null);

    expect(await collectRepository(request)).toEqual({
      collected: 0,
      discarded: 0,
      capped: false,
    });
    expect(github.listMergedPullRequests).not.toHaveBeenCalled();
    expect(succeededWith()?.collectedThrough).toBeInstanceOf(Date);
  });

  it("writes no successful run when the repository is out of reach", async () => {
    github.resolveRepositoryConnection.mockResolvedValue({
      token: "ghs_secret",
      provider: { resolveGrant: vi.fn().mockResolvedValue(null) },
    });

    await expect(collectRepository(request)).rejects.toThrow(/reaches/);
    expect(succeededWith()).toBeUndefined();
  });

  it("collects the newest slice and owns the gap when the listing never ends", async () => {
    github.listMergedPullRequests.mockResolvedValue({
      pullRequests: [pullRequest],
      nextCursor: "next",
    });

    expect(await collectRepository(request)).toEqual({
      collected: 0,
      discarded: 0,
      capped: true,
    });
    expect(succeededWith()?.capped).toBe(true);
  });

  it("keeps the message when Inngest hands the error over serialized", async () => {
    // What `onFailure` actually receives: no prototype, just the fields.
    await recordFailedCollection("run-1", {
      name: "Error",
      message: "GitHub said 401",
    });

    const [{ data }] = db.knowledgeCollectionRun.updateMany.mock.calls[0];
    expect(data.failureReason).toBe("GitHub said 401");
  });

  it("marks the run failed without touching the watermark", async () => {
    await recordFailedCollection("run-1", new Error("GitHub said 502"));

    const [{ where, data }] =
      db.knowledgeCollectionRun.updateMany.mock.calls[0];
    expect(where.id).toBe("run-1");
    expect(data.status).toBe("FAILED");
    expect(data.failureReason).toBe("GitHub said 502");
    expect(data).not.toHaveProperty("collectedThrough");
  });
});

describe("a re-run over pull requests nothing has happened to", () => {
  it("stores nothing and never asks for a pull request in full", async () => {
    github.listMergedPullRequests.mockResolvedValue({
      pullRequests: [pullRequest],
      nextCursor: null,
    });
    db.knowledgeBundle.findMany.mockResolvedValue([
      { externalId: "PR_1", githubUpdatedAt: TOUCHED },
    ]);

    expect(await collectRepository(request)).toEqual({
      collected: 0,
      discarded: 0,
      capped: false,
    });
    expect(github.fetchPullRequestDetail).not.toHaveBeenCalled();
    expect(db.knowledgeBundle.upsert).not.toHaveBeenCalled();
    expect(succeededWith()?.collectedThrough).toBe(TOUCHED);
  });

  it("judges one the cheap way when its discussion has moved on", async () => {
    github.listMergedPullRequests.mockResolvedValue({
      pullRequests: [{ ...pullRequest, commentCount: 1 }],
      nextCursor: null,
    });

    expect(await collectRepository(request)).toEqual({
      collected: 0,
      discarded: 1,
      capped: false,
    });
    expect(github.fetchPullRequestDetail).not.toHaveBeenCalled();
    const [{ create }] = db.knowledgeBundle.upsert.mock.calls[0];
    expect(create.discardReason).toBe("NO_DISCUSSION");
  });
});
