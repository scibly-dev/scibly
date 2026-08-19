import type { Prisma } from "@scibly/db";

import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

const db = vi.hoisted(() => ({
  organizationSubscription: { create: vi.fn() },
  organizationCredit: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));

const { db: mockedDb } = await import("@scibly/db");
const { provisionOrganizationPlan } =
  await import("@scibly/db/provision-organization");

const ORG = "org-new";

function subscriptionData() {
  const [call] = db.organizationSubscription.create.mock.calls;
  if (!call) throw new Error("no subscription was created");
  return (call[0] as Prisma.OrganizationSubscriptionCreateArgs).data;
}

function creditData() {
  const [call] = db.organizationCredit.create.mock.calls;
  if (!call) throw new Error("no credit row was created");
  return (call[0] as Prisma.OrganizationCreditCreateArgs).data;
}

beforeEach(() => {
  vi.resetAllMocks();

  transactionsRun(db);
  db.organizationSubscription.create.mockResolvedValue({ id: "sub-1" });
  db.organizationCredit.create.mockResolvedValue({ id: "credit-1" });
});

describe("TP1 — the evaluation window opens at creation", () => {
  it("TP1: the organization starts on TRIAL, active, from its creation moment", async () => {
    await provisionOrganizationPlan(mockedDb, ORG, "TRIAL");

    expect(subscriptionData()).toMatchObject({
      organizationId: ORG,
      plan: "TRIAL",
      status: "ACTIVE",
    });
    expect(subscriptionData().currentPeriodStart).toBeInstanceOf(Date);
  });

  it("TP1: the credit balance holds the catalogue's 100-generation grant and an empty top-up bucket", async () => {
    await provisionOrganizationPlan(mockedDb, ORG, "TRIAL");

    expect(creditData()).toMatchObject({
      organizationId: ORG,
      allowanceRemaining: 100,
      topupRemaining: 0,
    });

    expect(creditData().allowanceRemaining).toBe(
      PLAN_CATALOGUE.TRIAL.generations.amount,
    );
  });
});

describe("TP2 — one-time, non-recurring", () => {
  it("TP2: the subscription carries no renewal anchor for a reset to hang on", async () => {
    await provisionOrganizationPlan(mockedDb, ORG, "TRIAL");

    expect(subscriptionData()).not.toHaveProperty("currentPeriodEnd");
    expect(creditData()).not.toHaveProperty("periodEnd");
  });

  it("TP2: the catalogue itself marks the trial grant as non-renewing", () => {
    expect(PLAN_CATALOGUE.TRIAL.generations.renews).toBe(false);
  });
});

describe("TP4 — never half-provisioned", () => {
  it("TP4: subscription and credit row are issued in one transaction", async () => {
    await provisionOrganizationPlan(mockedDb, ORG, "TRIAL");

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.organizationSubscription.create).toHaveBeenCalledTimes(1);
    expect(db.organizationCredit.create).toHaveBeenCalledTimes(1);
  });
});
