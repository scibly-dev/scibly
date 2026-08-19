import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

// Wiring rows live in stream-chat.test.ts; wire rows in shared/ai/errors.test.ts.
const db = vi.hoisted(() => ({
  organizationSubscription: { findUnique: vi.fn() },
  organizationCredit: { updateMany: vi.fn(), findUnique: vi.fn() },
  creditLedgerEntry: { create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));

const { db: mockedDb } = await import("@scibly/db");
const { chargeAiGeneration } = await import("@scibly/api/entitlement");

const ORG = "org-a";
const ACTOR = "user-1";
const NOTEBOOK = "nb-1";

const PERIOD_START = new Date("2026-08-01T00:00:00.000Z");

const ALLOWANCE_DEBIT = {
  where: { organizationId: ORG, allowanceRemaining: { gte: 1 } },
  data: { allowanceRemaining: { decrement: 1 } },
};
const TOPUP_DEBIT = {
  where: { organizationId: ORG, topupRemaining: { gte: 1 } },
  data: { topupRemaining: { decrement: 1 } },
};

function charge<T>(operation: () => Promise<T>) {
  return chargeAiGeneration(
    {
      db: mockedDb,
      organizationId: ORG,
      actorId: ACTOR,
      notebookId: NOTEBOOK,
      action: "CHAT_MESSAGE",
    },
    operation,
  );
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("expected the operation to be refused, but it resolved");
}

function debitCall(n: number) {
  return db.organizationCredit.updateMany.mock.calls[n]?.[0] as unknown;
}

function onPlan(plan: string | null) {
  db.organizationSubscription.findUnique.mockResolvedValue(
    plan === null ? null : { plan },
  );
}

function debitsReport(...counts: number[]) {
  db.organizationCredit.updateMany.mockReset();
  for (const count of counts) {
    db.organizationCredit.updateMany.mockResolvedValueOnce({ count });
  }

  db.organizationCredit.updateMany.mockResolvedValue({ count: 1 });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  transactionsRun(db);
  onPlan("STARTER");
  debitsReport(1);
  db.organizationCredit.findUnique.mockResolvedValue({
    periodStart: PERIOD_START,
  });
  db.creditLedgerEntry.create.mockResolvedValue({ id: "entry-1" });
  db.creditLedgerEntry.update.mockResolvedValue({ id: "entry-1" });
});

describe("GE1/GE4/GE8 — a permitted action", () => {
  it("GE1: debits exactly one generation and returns the operation's result", async () => {
    const result = await charge(async () => "streamed");

    expect(result).toBe("streamed");
    expect(db.organizationCredit.updateMany).toHaveBeenCalledTimes(1);
    expect(debitCall(0)).toEqual(ALLOWANCE_DEBIT);
  });

  it("GE4: the debit is one guarded statement — no read precedes it", async () => {
    await charge(async () => "ok");

    const [firstDebit] =
      db.organizationCredit.updateMany.mock.invocationCallOrder;
    const [firstRead] =
      db.organizationCredit.findUnique.mock.invocationCallOrder;
    expect(firstDebit).toBeLessThan(firstRead!);
    expect(debitCall(0)).toEqual(ALLOWANCE_DEBIT);
  });

  it("GE8: an operation that resolves stays charged — nothing is credited back", async () => {
    await charge(async () => "ok");

    const increments = db.organizationCredit.updateMany.mock.calls.filter(
      ([args]) => JSON.stringify(args).includes("increment"),
    );
    expect(increments).toHaveLength(0);
    expect(db.creditLedgerEntry.update).not.toHaveBeenCalled();
  });
});

describe("GE2 — the allowance empties before a top-up is touched", () => {
  it("GE2: an exhausted allowance falls through to the top-up bucket, same guarded shape", async () => {
    debitsReport(0, 1);

    await charge(async () => "ok");

    expect(debitCall(0)).toEqual(ALLOWANCE_DEBIT);
    expect(debitCall(1)).toEqual(TOPUP_DEBIT);
  });

  it("GE2: a live allowance never touches the top-up bucket", async () => {
    await charge(async () => "ok");

    expect(db.organizationCredit.updateMany).toHaveBeenCalledTimes(1);
  });
});

describe("GE3 — both buckets empty", () => {
  it("GE3: the operation never runs and the refusal maps to 402", async () => {
    debitsReport(0, 0);
    const operation = vi.fn(async () => "never");

    const error = await refusal(() => charge(operation));

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(operation).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("GE3: the refusal names credits exhaustion, so a surface can restate it in its own words", async () => {
    debitsReport(0, 0);

    const error = await refusal(() => charge(async () => "never"));

    expect(error.applicationCode).toBe("entitlement.credits_exhausted");
  });
});

describe("GE5 — an entitlement that cannot be resolved fails closed", () => {
  it("GE5: a missing subscription refuses before any debit is attempted", async () => {
    onPlan(null);
    const operation = vi.fn(async () => "never");

    const error = await refusal(() => charge(operation));

    expect(error.applicationCode).toBe("entitlement.unresolvable");
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  });

  it("GE5: a missing credit row is unresolvable, not merely out of credits", async () => {
    debitsReport(0, 0);
    db.organizationCredit.findUnique.mockResolvedValue(null);

    const error = await refusal(() => charge(async () => "never"));

    expect(error.applicationCode).toBe("entitlement.unresolvable");
    expect(error.code).not.toBe("PAYMENT_REQUIRED");
  });
});

describe("GE6 — every charge leaves evidence", () => {
  it("GE6: the entry names the organization, actor, notebook, action, frozen cost and bucket", async () => {
    await charge(async () => "ok");

    expect(db.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: {
        organizationId: ORG,
        actorId: ACTOR,
        notebookId: NOTEBOOK,
        action: "CHAT_MESSAGE",
        creditsCharged: 1,
        bucket: "ALLOWANCE",
      },
    });
  });

  it("GE6: a top-up charge records the bucket it actually drew from", async () => {
    debitsReport(0, 1);

    await charge(async () => "ok");

    expect(db.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ bucket: "TOPUP" }),
    });
  });
});

describe("GE7 — a failed operation is refunded, on the record", () => {
  it("GE7: the debited bucket is credited back and the entry is marked, never deleted", async () => {
    const failure = new Error("model id could not be resolved");

    await expect(charge(async () => Promise.reject(failure))).rejects.toBe(
      failure,
    );

    expect(debitCall(1)).toEqual({
      where: { organizationId: ORG, periodStart: PERIOD_START },
      data: { allowanceRemaining: { increment: 1 } },
    });
    expect(db.creditLedgerEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: { refundedAt: expect.any(Date) },
    });
  });

  it("GE7: a top-up charge is refunded into the top-up bucket, not the allowance", async () => {
    debitsReport(0, 1);

    await expect(
      charge(async () => Promise.reject(new Error("boom"))),
    ).rejects.toThrow("boom");

    expect(debitCall(2)).toEqual({
      where: { organizationId: ORG },
      data: { topupRemaining: { increment: 1 } },
    });
  });

  it("GE7: a refund the period has outlived credits nothing back", async () => {
    debitsReport(1);

    db.organizationCredit.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      charge(async () => Promise.reject(new Error("boom"))),
    ).rejects.toThrow("boom");

    expect(db.creditLedgerEntry.update).not.toHaveBeenCalled();
  });

  it("GE7: a top-up refund is owed whatever period it arrives in", async () => {
    debitsReport(0, 1);

    await expect(
      charge(async () => Promise.reject(new Error("boom"))),
    ).rejects.toThrow("boom");

    expect(debitCall(2)).not.toHaveProperty("where.periodStart");
  });

  it("GE7: a refund that itself fails is reported, and the original failure still propagates", async () => {
    const failure = new Error("the actual problem");
    db.organizationCredit.updateMany
      .mockReset()
      .mockResolvedValueOnce({ count: 1 })
      .mockRejectedValueOnce(new Error("db went away"));

    await expect(charge(async () => Promise.reject(failure))).rejects.toBe(
      failure,
    );

    expect(console.error).toHaveBeenCalled();
  });
});

describe("GE9 — the internal plan is a plan, not a bypass", () => {
  it("GE9: an internal organization with an emptied credit row is refused like anyone else", async () => {
    onPlan("INTERNAL");
    debitsReport(0, 0);
    const operation = vi.fn(async () => "never");

    const error = await refusal(() => charge(operation));

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(operation).not.toHaveBeenCalled();
  });

  it("GE9: an internal organization's charge writes the same ledger entry", async () => {
    onPlan("INTERNAL");

    await charge(async () => "ok");

    expect(db.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ bucket: "ALLOWANCE", creditsCharged: 1 }),
    });
  });
});

describe("GE10 — no charge without evidence", () => {
  it("GE10: the debit and its ledger entry are issued inside one transaction", async () => {
    await charge(async () => "ok");

    const [transaction] = db.$transaction.mock.calls[0] ?? [];
    expect(transaction).toBeTypeOf("function");

    expect(db.organizationCredit.updateMany).toHaveBeenCalledTimes(1);
    expect(db.creditLedgerEntry.create).toHaveBeenCalledTimes(1);
  });

  it("GE10: a failed ledger write stops the operation — no compensating write, the transaction discards the debit", async () => {
    db.creditLedgerEntry.create.mockRejectedValue(new Error("ledger down"));
    const operation = vi.fn(async () => "never");

    await expect(charge(operation)).rejects.toThrow("ledger down");

    expect(operation).not.toHaveBeenCalled();
    const increments = db.organizationCredit.updateMany.mock.calls.filter(
      ([args]) => JSON.stringify(args).includes("increment"),
    );
    expect(increments).toHaveLength(0);
  });
});
