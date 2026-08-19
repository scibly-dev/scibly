import { beforeEach, describe, expect, it, vi } from "vitest";

const policy = vi.hoisted(() => ({ requireOrgMember: vi.fn() }));

const db = vi.hoisted(() => ({
  organizationAIModel: { findFirst: vi.fn(), updateMany: vi.fn() },
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("../../server/policy", () => policy);

const { recordModelTestResult } = await import("./org-ai-config.operations");

const ORG_ID = "org-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("S4: recordModelTestResult scopes its write to the caller's organization", () => {
  it("updates by id and organizationId together, never id alone", async () => {
    await recordModelTestResult("m1", ORG_ID, true);

    expect(db.organizationAIModel.updateMany).toHaveBeenCalledWith({
      where: { id: "m1", organizationId: ORG_ID },
      data: { lastTestStatus: "OK", lastTestedAt: expect.any(Date) },
    });
  });

  it("records FAILED for a failed probe", async () => {
    await recordModelTestResult("m1", ORG_ID, false);

    expect(db.organizationAIModel.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastTestStatus: "FAILED" }),
      }),
    );
  });
});
