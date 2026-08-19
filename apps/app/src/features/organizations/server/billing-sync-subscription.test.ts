import type { Prisma } from "@scibly/db";

import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

const db = vi.hoisted(() => ({
  organizationCredit: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  organizationSubscription: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  organization: { updateMany: vi.fn() },
  organizationAIModel: { updateMany: vi.fn() },
  member: { findFirst: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));

const { db: mockedDb } = await import("@scibly/db");
const { syncSubscription } =
  await import("@scibly/ee-billing/sync-subscription");
const { mapPluginPlanToSubscriptionPlan, mapStripeStatusToSubscriptionStatus } =
  await import("@scibly/ee-billing/plan-mapping");
const { authorizeStripeReference } =
  await import("@scibly/ee-billing/authorize-reference");

type PluginSubscription = Parameters<typeof syncSubscription>[1];

const ORG = "org-1";
const USER = "user-1";

const STORED_PERIOD_START = new Date("2026-01-01T00:00:00Z");
const NEW_PERIOD_START = new Date("2026-02-01T00:00:00Z");
const NEW_PERIOD_END = new Date("2026-03-01T00:00:00Z");
// Ten days into that 28-day period, so a prorated switch is worth 18/28 of the difference.
const REMAINING_FRACTION = 18 / 28;

function pluginSubscription(
  overrides: Partial<PluginSubscription> = {},
): PluginSubscription {
  return {
    id: "bookkeeping-1",
    plan: "starter",
    referenceId: ORG,
    status: "active",
    periodStart: NEW_PERIOD_START,
    periodEnd: NEW_PERIOD_END,
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    ...overrides,
  } as unknown as PluginSubscription;
}

function creditUpdateData() {
  const [call] = db.organizationCredit.update.mock.calls;
  return call?.[0]?.data as Prisma.OrganizationCreditUpdateInput | undefined;
}

function subscriptionUpdateData() {
  const [call] = db.organizationSubscription.update.mock.calls;
  if (!call) throw new Error("organizationSubscription.update was not called");
  return call[0].data as Prisma.OrganizationSubscriptionUpdateInput;
}

beforeEach(() => {
  vi.resetAllMocks();

  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-02-11T00:00:00Z"));
  transactionsRun(db);

  db.organizationCredit.findUnique.mockResolvedValue({
    periodStart: STORED_PERIOD_START,
  });
  db.organizationCredit.update.mockResolvedValue({});
  db.organizationCredit.updateMany.mockResolvedValue({ count: 1 });

  db.organizationSubscription.findUnique.mockResolvedValue({
    plan: "STARTER",
  });
  db.organizationSubscription.update.mockResolvedValue({});
  db.organizationSubscription.updateMany.mockResolvedValue({ count: 0 });
  db.organization.updateMany.mockResolvedValue({ count: 0 });
  db.organizationAIModel.updateMany.mockResolvedValue({ count: 0 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SS1 — first subscribe", () => {
  it("SS1: resets the allowance to the new plan's catalogue amount and syncs period fields", async () => {
    await syncSubscription(mockedDb, pluginSubscription());

    expect(creditUpdateData()).toMatchObject({
      allowanceRemaining: PLAN_CATALOGUE.STARTER.generations.amount,
      periodStart: NEW_PERIOD_START,
      periodEnd: NEW_PERIOD_END,
    });
    expect(subscriptionUpdateData()).toMatchObject({
      plan: "STARTER",
      status: "ACTIVE",
      currentPeriodStart: NEW_PERIOD_START,
      currentPeriodEnd: NEW_PERIOD_END,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
    });
  });
});

describe("SS2 — renewal", () => {
  it("SS2: a rolled-forward period resets the allowance again", async () => {
    const subscription = pluginSubscription({ plan: "business" });

    await syncSubscription(mockedDb, subscription);

    expect(creditUpdateData()?.allowanceRemaining).toBe(
      PLAN_CATALOGUE.BUSINESS.generations.amount,
    );
  });
});

describe("AN6 — the allowance warnings re-arm with the allowance", () => {
  it("AN6: a reset clears the notified threshold", async () => {
    await syncSubscription(mockedDb, pluginSubscription());

    expect(creditUpdateData()?.notifiedAllowanceThreshold).toBe(0);
  });
});

describe("SS3 — top-ups survive resets", () => {
  it("SS3: neither reset writes topupRemaining", async () => {
    await syncSubscription(mockedDb, pluginSubscription());

    expect(creditUpdateData()).not.toHaveProperty("topupRemaining");
  });
});

// Mid-period: nothing renewed, so only the plan change itself is at stake.
const midPeriod = () =>
  db.organizationCredit.findUnique.mockResolvedValue({
    periodStart: NEW_PERIOD_START,
  });

// What Stripe invoices for the rest of the period, in generations rather than cents.
const PRORATED_STARTER_TO_PRO = Math.trunc(
  (PLAN_CATALOGUE.PRO.generations.amount -
    PLAN_CATALOGUE.STARTER.generations.amount) *
    REMAINING_FRACTION,
);

describe("PC1–PC4, PC8 — an upgrade applies the moment it is bought", () => {
  beforeEach(midPeriod);

  it("PC1: the plan on the row changes without waiting for a renewal", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "pro" }));

    expect(subscriptionUpdateData()).toMatchObject({ plan: "PRO" });
  });

  it("PC2/PC3: the allowance rises by the invoiced share of the difference, on top of what is left", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "pro" }));

    expect(creditUpdateData()?.allowanceRemaining).toEqual({
      increment: PRORATED_STARTER_TO_PRO,
    });
  });

  it("PC2: an upgrade on the last day of the period grants next to nothing", async () => {
    vi.setSystemTime(new Date("2026-02-28T12:00:00Z"));

    await syncSubscription(mockedDb, pluginSubscription({ plan: "pro" }));

    expect(creditUpdateData()?.allowanceRemaining).toEqual({ increment: 250 });
  });

  it("PC4: the warnings re-arm against the ceiling that was just paid for", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "pro" }));

    expect(creditUpdateData()?.notifiedAllowanceThreshold).toBe(0);
  });

  it("PC8: the purchased top-up balance is not written", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "pro" }));

    expect(creditUpdateData()).not.toHaveProperty("topupRemaining");
  });

  it("PC9: a past-due upgrade still grants; the grace clock decides the rest", async () => {
    await syncSubscription(
      mockedDb,
      pluginSubscription({ plan: "pro", status: "past_due" }),
    );

    expect(creditUpdateData()?.allowanceRemaining).toEqual({
      increment: PRORATED_STARTER_TO_PRO,
    });
  });
});

describe("PC5/PC7/PC8 — a decrease waits for the period already paid for", () => {
  beforeEach(() => {
    midPeriod();
    db.organizationSubscription.findUnique.mockResolvedValue({ plan: "PRO" });
  });

  it("PC5/PC7: the row keeps the plan that was bought, whichever door the decrease came through", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "starter" }));

    expect(subscriptionUpdateData()).toMatchObject({ plan: "PRO" });
  });

  it("PC5/PC8: no credit is written, so neither allowance nor top-ups move", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "starter" }));

    expect(db.organizationCredit.update).not.toHaveBeenCalled();
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
  });

  it("PC5: BYOAI keeps running, since the plan in effect still includes it", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "starter" }));

    expect(db.organization.updateMany).not.toHaveBeenCalled();
    expect(db.organizationAIModel.updateMany).not.toHaveBeenCalled();
  });
});

describe("PC6 — the decrease lands at the next period start", () => {
  it("PC6: the plan drops, the allowance resets to its monthly amount and the warnings re-arm", async () => {
    db.organizationSubscription.findUnique.mockResolvedValue({ plan: "PRO" });

    await syncSubscription(mockedDb, pluginSubscription({ plan: "starter" }));

    expect(subscriptionUpdateData()).toMatchObject({ plan: "STARTER" });
    expect(creditUpdateData()).toMatchObject({
      allowanceRemaining: PLAN_CATALOGUE.STARTER.generations.amount,
      notifiedAllowanceThreshold: 0,
    });
  });
});

describe("PC11 — a webhook reporting the plan already held", () => {
  it("PC11: a redelivery finds the plan switched and grants nothing twice", async () => {
    midPeriod();
    db.organizationSubscription.findUnique.mockResolvedValue({ plan: "PRO" });

    await syncSubscription(mockedDb, pluginSubscription({ plan: "pro" }));

    expect(db.organizationCredit.update).not.toHaveBeenCalled();
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
  });
});

describe("SS5 — the subscription row always updates", () => {
  it("SS5: a status change with an unchanged period still updates the subscription row", async () => {
    db.organizationCredit.findUnique.mockResolvedValue({
      periodStart: NEW_PERIOD_START,
    });
    const subscription = pluginSubscription({ status: "past_due" });

    await syncSubscription(mockedDb, subscription);

    expect(db.organizationCredit.update).not.toHaveBeenCalled();
    expect(subscriptionUpdateData()).toMatchObject({ status: "PAST_DUE" });
  });
});

describe("SS6 — no period on the incoming payload", () => {
  it("SS6: currentPeriodStart is left untouched and no reset is attempted", async () => {
    const subscription = pluginSubscription({ periodStart: undefined });

    await syncSubscription(mockedDb, subscription);

    expect(subscriptionUpdateData().currentPeriodStart).toBeUndefined();
    expect(db.organizationCredit.update).not.toHaveBeenCalled();
  });
});

describe("SS7 — an unmapped plan fails closed", () => {
  it("SS7: throws and never opens a transaction", async () => {
    const subscription = pluginSubscription({ plan: "enterprise" });

    await expect(syncSubscription(mockedDb, subscription)).rejects.toThrow(
      /unmapped plan/i,
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("SS8 — an unmapped status fails closed", () => {
  it("SS8: throws and never opens a transaction", async () => {
    const subscription = pluginSubscription({ status: "some_new_status" });

    await expect(syncSubscription(mockedDb, subscription)).rejects.toThrow(
      /unmapped subscription status/i,
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("SS9 — a missing credit row fails closed", () => {
  it("SS9: throws and the subscription row is never updated", async () => {
    db.organizationCredit.findUnique.mockResolvedValue(null);

    await expect(
      syncSubscription(mockedDb, pluginSubscription()),
    ).rejects.toThrow(/no credit row/i);
    expect(db.organizationSubscription.update).not.toHaveBeenCalled();
  });
});

describe("SS10 — cancellation", () => {
  it("SS10: sets status CANCELED on the subscription row", async () => {
    db.organizationCredit.findUnique.mockResolvedValue({
      periodStart: NEW_PERIOD_START,
    });
    const subscription = pluginSubscription({ status: "canceled" });

    await syncSubscription(mockedDb, subscription);

    expect(subscriptionUpdateData()).toMatchObject({ status: "CANCELED" });
  });

  it("SS17: the purchased seats end with the subscription they were a line item on", async () => {
    await syncSubscription(
      mockedDb,
      pluginSubscription({ status: "canceled" }),
    );

    expect(subscriptionUpdateData()).toMatchObject({
      purchasedLearnerSeats: 0,
    });
  });

  it.each(["active", "past_due"])(
    "SS17: a %s subscription's seats are left alone",
    async (status) => {
      await syncSubscription(mockedDb, pluginSubscription({ status }));

      expect(subscriptionUpdateData().purchasedLearnerSeats).toBeUndefined();
    },
  );
});

describe("SS11/SS12 — a plan without BYOAI hands inference back", () => {
  const chatHandback = () => db.organization.updateMany.mock.calls[0]?.[0];
  const imageHandback = () =>
    db.organizationAIModel.updateMany.mock.calls[0]?.[0];

  it("SS11: nulls the default chat model and deactivates the image endpoints on Starter", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "starter" }));

    expect(chatHandback()).toEqual({
      where: { id: ORG, defaultChatModelId: { not: null } },
      data: { defaultChatModelId: null },
    });
    expect(imageHandback()).toEqual({
      where: { organizationId: ORG, type: "IMAGE", isActive: true },
      data: { isActive: false },
    });
  });

  it("SS11: does the same for a canceled Business subscription", async () => {
    await syncSubscription(
      mockedDb,
      pluginSubscription({ plan: "business", status: "canceled" }),
    );

    expect(db.organization.updateMany).toHaveBeenCalledTimes(1);
    expect(db.organizationAIModel.updateMany).toHaveBeenCalledTimes(1);
  });

  it("SS11/BU2: never touches the endpoint rows themselves or the chat selection", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "starter" }));

    expect(db.organizationAIModel.updateMany).toHaveBeenCalledTimes(1);
    expect(imageHandback().where.type).toBe("IMAGE");
    expect(Object.keys(imageHandback().data)).toEqual(["isActive"]);
  });

  it("SS11: leaves a paying Business organization alone", async () => {
    await syncSubscription(mockedDb, pluginSubscription({ plan: "business" }));

    expect(db.organization.updateMany).not.toHaveBeenCalled();
    expect(db.organizationAIModel.updateMany).not.toHaveBeenCalled();
  });

  it("FG4: a past-due Business organization keeps running on its own endpoints", async () => {
    await syncSubscription(
      mockedDb,
      pluginSubscription({ plan: "business", status: "past_due" }),
    );

    expect(db.organization.updateMany).not.toHaveBeenCalled();
    expect(db.organizationAIModel.updateMany).not.toHaveBeenCalled();
  });

  it("SS12: a redelivered webhook for an unchanged Starter plan hands back again, harmlessly", async () => {
    const subscription = pluginSubscription({ plan: "starter" });

    await syncSubscription(mockedDb, subscription);
    await syncSubscription(mockedDb, subscription);

    expect(db.organization.updateMany).toHaveBeenCalledTimes(2);
    expect(db.organization.updateMany.mock.calls[1][0]).toEqual(chatHandback());
  });
});

describe("PM1 — plugin plan name to SubscriptionPlan", () => {
  it("PM1: starter/business/pro map to STARTER/BUSINESS/PRO", () => {
    expect(mapPluginPlanToSubscriptionPlan("starter")).toBe("STARTER");
    expect(mapPluginPlanToSubscriptionPlan("business")).toBe("BUSINESS");
    expect(mapPluginPlanToSubscriptionPlan("pro")).toBe("PRO");
  });

  it("PM1: an unmapped plan name throws", () => {
    expect(() => mapPluginPlanToSubscriptionPlan("enterprise")).toThrow();
  });
});

describe("PM2 — Stripe status to SubscriptionStatus", () => {
  it("PM2: active/trialing map to ACTIVE", () => {
    expect(mapStripeStatusToSubscriptionStatus("active")).toBe("ACTIVE");
    expect(mapStripeStatusToSubscriptionStatus("trialing")).toBe("ACTIVE");
  });

  it("PM2: past_due/unpaid/incomplete/paused map to PAST_DUE", () => {
    for (const status of [
      "past_due",
      "unpaid",
      "incomplete",
      "paused",
    ] as const) {
      expect(mapStripeStatusToSubscriptionStatus(status)).toBe("PAST_DUE");
    }
  });

  it("PM2: canceled/incomplete_expired map to CANCELED", () => {
    expect(mapStripeStatusToSubscriptionStatus("canceled")).toBe("CANCELED");
    expect(mapStripeStatusToSubscriptionStatus("incomplete_expired")).toBe(
      "CANCELED",
    );
  });

  it("PM2: an unmapped status throws", () => {
    expect(() =>
      mapStripeStatusToSubscriptionStatus("weird" as never),
    ).toThrow();
  });
});

const OWNER_GATED_ACTIONS = [
  "upgrade-subscription",
  "cancel-subscription",
  "restore-subscription",
  "billing-portal",
] as const;

describe("AR1/AR2 — owner-only billing actions", () => {
  it.each(OWNER_GATED_ACTIONS)(
    "AR1: %s denies a member who is not the owner",
    async (action) => {
      db.member.findFirst.mockResolvedValue(null);

      const allowed = await authorizeStripeReference(mockedDb, {
        user: { id: USER },
        referenceId: ORG,
        action,
      });

      expect(allowed).toBe(false);
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { organizationId: ORG, userId: USER, role: "owner" },
        select: { id: true },
      });
    },
  );

  it.each(OWNER_GATED_ACTIONS)(
    "AR2: %s allows the organization's owner",
    async (action) => {
      db.member.findFirst.mockResolvedValue({ id: "member-1" });

      const allowed = await authorizeStripeReference(mockedDb, {
        user: { id: USER },
        referenceId: ORG,
        action,
      });

      expect(allowed).toBe(true);
    },
  );
});

describe("AR3/AR4 — list-subscription is member-readable", () => {
  it("AR3: any organization member may list the subscription", async () => {
    db.member.findFirst.mockResolvedValue({ id: "member-1" });

    const allowed = await authorizeStripeReference(mockedDb, {
      user: { id: USER },
      referenceId: ORG,
      action: "list-subscription",
    });

    expect(allowed).toBe(true);
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { organizationId: ORG, userId: USER },
      select: { id: true },
    });
  });

  it("AR4: a non-member is denied", async () => {
    db.member.findFirst.mockResolvedValue(null);

    const allowed = await authorizeStripeReference(mockedDb, {
      user: { id: USER },
      referenceId: ORG,
      action: "list-subscription",
    });

    expect(allowed).toBe(false);
  });
});
