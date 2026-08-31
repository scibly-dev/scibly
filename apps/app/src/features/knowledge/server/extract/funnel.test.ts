import { beforeEach, describe, expect, it, vi } from "vitest";

const triage = vi.hoisted(() => ({
  recordFunnelFailure: vi.fn(),
  triageBundles: vi.fn(),
}));

vi.mock("@scibly/db", () => ({
  db: { knowledgeBundle: { findMany: vi.fn() } },
  Prisma: { DbNull: "DbNull" },
}));
vi.mock("@/lib/inngest/client", () => ({
  inngest: { createFunction: vi.fn(), send: vi.fn() },
}));
vi.mock("./triage", () => triage);
vi.mock("./extract", () => ({ extractInsights: vi.fn() }));

const { recordingFailure } = await import("./funnel");
const { FUNNEL } = await import("./thresholds");

beforeEach(() => vi.clearAllMocks());

describe("a batch that fails records itself, because onFailure only sees one of it", () => {
  const boom = () => Promise.reject(new Error("gateway down"));

  it("stays quiet while Inngest still has retries left", async () => {
    await expect(recordingFailure(0, ["a", "b"], boom)).rejects.toThrow(
      "gateway down",
    );

    // Recording here would show a failure the next attempt may well undo.
    expect(triage.recordFunnelFailure).not.toHaveBeenCalled();
  });

  it("records every bundle of the batch on the last attempt, and still throws", async () => {
    await expect(
      recordingFailure(FUNNEL.retries, ["a", "b"], boom),
    ).rejects.toThrow("gateway down");

    expect(triage.recordFunnelFailure).toHaveBeenCalledWith(
      ["a", "b"],
      expect.objectContaining({ message: "gateway down" }),
    );
  });

  it("leaves a run that worked alone", async () => {
    expect(await recordingFailure(FUNNEL.retries, ["a"], async () => 7)).toBe(
      7,
    );
    expect(triage.recordFunnelFailure).not.toHaveBeenCalled();
  });
});
