import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  member: { findFirst: vi.fn() },
}));

vi.mock("@scibly/db", () => ({ db }));

const { requireOrgMember } = await import("./policy");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the organization role hierarchy", () => {
  it("RH1: refuses a caller with no membership row with FORBIDDEN", async () => {
    db.member.findFirst.mockResolvedValueOnce(null);

    await expect(
      requireOrgMember("org1", "user1", "admin_or_owner"),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "organization.access_denied",
    });
  });

  it("RH2: admin_or_owner is satisfied by an owner", async () => {
    db.member.findFirst.mockResolvedValueOnce({ id: "m1", role: "owner" });

    await expect(
      requireOrgMember("org1", "user1", "admin_or_owner"),
    ).resolves.toMatchObject({ role: "owner" });
  });

  it("RH3: admin_or_owner is satisfied by an admin", async () => {
    db.member.findFirst.mockResolvedValueOnce({ id: "m1", role: "admin" });

    await expect(
      requireOrgMember("org1", "user1", "admin_or_owner"),
    ).resolves.toMatchObject({ role: "admin" });
  });

  it("RH4: admin_or_owner refuses a plain member with FORBIDDEN", async () => {
    db.member.findFirst.mockResolvedValueOnce({ id: "m1", role: "member" });

    await expect(
      requireOrgMember("org1", "user1", "admin_or_owner"),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "organization.admin_required",
    });
  });

  it("RH5: required role member is satisfied by an owner, not only by the literal member role", async () => {
    db.member.findFirst.mockResolvedValueOnce({ id: "m1", role: "owner" });

    await expect(
      requireOrgMember("org1", "user1", "member"),
    ).resolves.toMatchObject({ role: "owner" });
  });
});
