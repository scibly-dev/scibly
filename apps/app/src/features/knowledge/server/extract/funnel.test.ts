import type * as BundleLifecycle from "./bundle-lifecycle";

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  knowledgeBundle: { findMany: vi.fn(), updateMany: vi.fn() },
}));
const lifecycle = vi.hoisted(() => ({
  giveUpOnBundles: vi.fn(),
  recordFunnelFailure: vi.fn(),
}));
const entitlement = vi.hoisted(() => ({ allowedToKnowledgeSync: vi.fn() }));

vi.mock("@scibly/db", () => ({ db, Prisma: { DbNull: "DbNull" } }));
vi.mock("@scibly/api/entitlement", () => entitlement);
vi.mock("@/lib/inngest/client", () => ({
  inngest: { createFunction: vi.fn(), send: vi.fn() },
}));
// Partial: `isExhausted` is the threshold under test, not a collaborator.
vi.mock("./bundle-lifecycle", async (importOriginal) => ({
  ...(await importOriginal<typeof BundleLifecycle>()),
  ...lifecycle,
}));
vi.mock("./triage", () => ({ triageBundles: vi.fn() }));
vi.mock("./extract", () => ({ extractInsights: vi.fn() }));

const { recordingFailure, strandedBundles, unreadBundles } =
  await import("./funnel");
const { FUNNEL } = await import("./thresholds");

const NOW = new Date("2026-03-01T06:00:00Z");

const bundle = (id: string, organizationId: string, attempts = 0) => ({
  id,
  organizationId,
  attempts,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.knowledgeBundle.findMany.mockResolvedValue([]);
  entitlement.allowedToKnowledgeSync.mockImplementation(
    async (_db: unknown, ids: string[]) => new Set(ids),
  );
});

describe("a batch that fails records itself, because onFailure only sees one of it", () => {
  const boom = () => Promise.reject(new Error("gateway down"));

  it("stays quiet while Inngest still has retries left", async () => {
    await expect(recordingFailure(0, ["a", "b"], boom)).rejects.toThrow(
      "gateway down",
    );

    expect(lifecycle.recordFunnelFailure).not.toHaveBeenCalled();
  });

  it("records every bundle of the batch on the last attempt, and still throws", async () => {
    await expect(
      recordingFailure(FUNNEL.retries, ["a", "b"], boom),
    ).rejects.toThrow("gateway down");

    expect(lifecycle.recordFunnelFailure).toHaveBeenCalledWith(
      ["a", "b"],
      expect.objectContaining({ message: "gateway down" }),
    );
  });

  it("leaves a run that worked alone", async () => {
    expect(await recordingFailure(FUNNEL.retries, ["a"], async () => 7)).toBe(
      7,
    );
    expect(lifecycle.recordFunnelFailure).not.toHaveBeenCalled();
  });
});

describe("stranded means given up on, not merely unfinished", () => {
  it("leaves bundles collected within the grace window alone", async () => {
    await unreadBundles("org-1", ["repo-1"], NOW);

    const { where } = db.knowledgeBundle.findMany.mock.calls[0]![0];
    expect(where.collectedAt.lt).toEqual(
      new Date(NOW.getTime() - FUNNEL.retryAfterMinutes * 60 * 1_000),
    );
    expect(where).toMatchObject({ processedAt: null, discardReason: null });
  });

  it("asks the same question the sweep does", async () => {
    await unreadBundles("org-1", ["repo-1"], NOW);
    const unread = db.knowledgeBundle.findMany.mock.calls[0]![0].where;

    db.knowledgeBundle.findMany.mockClear();
    await strandedBundles(NOW);
    const swept = db.knowledgeBundle.findMany.mock.calls[0]![0].where;

    const { organizationId: _o, repositoryId: _r, ...scoped } = unread;
    expect(swept).toEqual(scoped);
  });
});

describe("the nightly sweep", () => {
  it("groups by organization and caps each one's night", async () => {
    db.knowledgeBundle.findMany.mockResolvedValue([
      bundle("a", "org-1"),
      bundle("b", "org-2"),
      bundle("c", "org-1"),
    ]);

    const { byOrg, gaveUp } = await strandedBundles(NOW);

    expect(byOrg.get("org-1")).toEqual(["a", "c"]);
    expect(byOrg.get("org-2")).toEqual(["b"]);
    expect(gaveUp).toBe(0);
  });

  it("lets go of a bundle that has failed every night, keeping its conversation", async () => {
    db.knowledgeBundle.findMany.mockResolvedValue([
      bundle("worn-out", "org-1", FUNNEL.maxAttempts),
      bundle("fresh", "org-1", 1),
    ]);

    const { byOrg, gaveUp } = await strandedBundles(NOW);

    expect(lifecycle.giveUpOnBundles).toHaveBeenCalledWith(["worn-out"]);
    expect(byOrg.get("org-1")).toEqual(["fresh"]);
    expect(gaveUp).toBe(1);
  });

  it("skips an organization that may no longer sync, without dropping the others", async () => {
    db.knowledgeBundle.findMany.mockResolvedValue([
      bundle("a", "lapsed"),
      bundle("b", "paying"),
    ]);
    entitlement.allowedToKnowledgeSync.mockResolvedValue(new Set(["paying"]));

    const { byOrg } = await strandedBundles(NOW);

    expect([...byOrg.keys()]).toEqual(["paying"]);
    // Batched: one query for the whole sweep, not one per organization.
    expect(entitlement.allowedToKnowledgeSync).toHaveBeenCalledTimes(1);
  });
});
