import { beforeEach, describe, expect, it, vi } from "vitest";

// The read is the whole subject here — the counter that renders it is client-side wiring.
const policy = vi.hoisted(() => ({
  requireOrganizationBySlug: vi.fn(),
  requireOrgMember: vi.fn(),
}));

const db = vi.hoisted(() => ({
  organizationCredit: { findUnique: vi.fn(), updateMany: vi.fn() },
  creditLedgerEntry: { create: vi.fn() },
  organizationSubscription: { findUnique: vi.fn() },
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("../../server/policy", () => policy);

const { readGenerationBalance } =
  await import("./generation-balance.operations");

const ORG_SLUG = "acme";
const ORG_ID = "org-1";
const AUTHOR = "user-author";

function credit(row: { allowance: number; topup: number } | null) {
  db.organizationCredit.findUnique.mockResolvedValue(
    row === null
      ? null
      : { allowanceRemaining: row.allowance, topupRemaining: row.topup },
  );
}

const read = () => readGenerationBalance(ORG_SLUG, AUTHOR);

beforeEach(() => {
  vi.clearAllMocks();
  policy.requireOrganizationBySlug.mockResolvedValue({ id: ORG_ID });
  policy.requireOrgMember.mockResolvedValue({ role: "member" });
  credit({ allowance: 0, topup: 0 });
});

describe("GB1 — one pool, one number", () => {
  it("adds the monthly allowance to the purchased top-ups", async () => {
    credit({ allowance: 120, topup: 45 });

    await expect(read()).resolves.toEqual({ remaining: 165 });
  });

  it("reports a spent allowance carried by top-ups alone", async () => {
    credit({ allowance: 0, topup: 500 });

    await expect(read()).resolves.toEqual({ remaining: 500 });
  });

  it("reports zero when both buckets are empty", async () => {
    credit({ allowance: 0, topup: 0 });

    await expect(read()).resolves.toEqual({ remaining: 0 });
  });

  it("reads only the organization's own credit row", async () => {
    await read();

    expect(db.organizationCredit.findUnique).toHaveBeenCalledWith({
      where: { organizationId: ORG_ID },
      select: { allowanceRemaining: true, topupRemaining: true },
    });
  });
});

describe("GB2 — a read that changes nothing", () => {
  it("debits no bucket and writes no ledger entry", async () => {
    credit({ allowance: 3, topup: 0 });

    await read();

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("resolves no plan — the balance is not an entitlement decision", async () => {
    await read();

    expect(db.organizationSubscription.findUnique).not.toHaveBeenCalled();
  });

  it("reports an empty pool as a number rather than a refusal", async () => {
    credit({ allowance: 0, topup: 0 });

    await expect(read()).resolves.toEqual({ remaining: 0 });
  });
});

describe("GB3 — the pool is the owner's to see", () => {
  it("refuses a caller the guard turns away", async () => {
    policy.requireOrgMember.mockRejectedValue(
      Object.assign(new Error("Access denied."), { code: "FORBIDDEN" }),
    );

    await expect(read()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reads no balance for a caller it refused", async () => {
    policy.requireOrgMember.mockRejectedValue(new Error("Access denied."));

    await expect(read()).rejects.toThrow();
    expect(db.organizationCredit.findUnique).not.toHaveBeenCalled();
  });

  it("resolves the organization from the slug rather than trusting it", async () => {
    await read();

    expect(policy.requireOrganizationBySlug).toHaveBeenCalledWith(ORG_SLUG);
  });

  it("demands the role that governs the rest of billing, not mere membership", async () => {
    await read();

    expect(policy.requireOrgMember).toHaveBeenCalledWith(
      ORG_ID,
      AUTHOR,
      "owner",
    );
  });
});

describe("GB4 — a missing credit row is an unknown balance, not an empty one", () => {
  it("reports null rather than zero", async () => {
    credit(null);

    await expect(read()).resolves.toEqual({ remaining: null });
  });
});
