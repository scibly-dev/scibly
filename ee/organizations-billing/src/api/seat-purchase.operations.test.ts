import { MAX_SEAT_PURCHASE } from "@scibly/ee-billing/plan-catalogue";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The role check is the real one — a doubled policy would prove nothing.

const counter = await vi.hoisted(async () =>
  (await import("@test/mocks/rate-limit-counter")).rateLimitCounter(),
);

const db = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  member: { findFirst: vi.fn() },
  organizationSubscription: { findUnique: vi.fn() },
  rateLimit: counter.model,
}));

const seats = vi.hoisted(() => ({
  purchaseLearnerSeats: vi.fn(),
  previewLearnerSeatPurchase: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@scibly/ee-billing/seats", () => seats);

const { isSeatPurchasable, previewSeatPurchase, purchaseSeats } =
  await import("./seat-purchase.operations");
const { BILLING_PURCHASES_PER_HOUR } =
  await import("./subscription-preconditions");

const ORG_SLUG = "acme";
const ORG_ID = "org-1";
const USER = "user-1";

function memberRole(role: string | null) {
  db.member.findFirst.mockResolvedValue(
    role === null ? null : { id: "m-1", role },
  );
}

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function subscription(
  row: {
    plan?: string;
    status?: string;
    pastDueSince?: Date | null;
    stripeSubscriptionId?: string | null;
  } | null,
) {
  db.organizationSubscription.findUnique.mockResolvedValue(
    row === null
      ? null
      : {
          plan: row.plan ?? "STARTER",
          status: row.status ?? "ACTIVE",
          pastDueSince: row.pastDueSince ?? null,
          stripeSubscriptionId:
            row.stripeSubscriptionId === undefined
              ? "sub_1"
              : row.stripeSubscriptionId,
        },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  db.organization.findUnique.mockResolvedValue({ id: ORG_ID });

  counter.clear();
  memberRole("owner");
  subscription({});
  seats.purchaseLearnerSeats.mockResolvedValue({ purchasedSeats: 3 });
  seats.previewLearnerSeatPurchase.mockResolvedValue({
    amountDueCents: 13_333,
    seatsAfter: 100,
    periodEnd: null,
  });
});

const buy = (quantity = 3) =>
  purchaseSeats({ orgSlug: ORG_SLUG, userId: USER, quantity });

describe("LB7 — a recurring charge is the owner's alone", () => {
  it("an owner may buy", async () => {
    await expect(buy()).resolves.toEqual({ purchasedSeats: 3 });
  });

  it("an admin is refused by the server, not merely by the card", async () => {
    memberRole("admin");

    await expect(buy()).rejects.toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "organization.role_required",
    });
    expect(seats.purchaseLearnerSeats).not.toHaveBeenCalled();
  });

  it("a member outside the organization is refused", async () => {
    memberRole(null);

    await expect(buy()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(seats.purchaseLearnerSeats).not.toHaveBeenCalled();
  });
});

describe("LB11 — the quantity is checked before Stripe is called", () => {
  it.each([0, -1, 1.5, Number.NaN, MAX_SEAT_PURCHASE + 1])(
    "refuses %s seats",
    async (quantity) => {
      await expect(buy(quantity)).rejects.toMatchObject({
        code: "BAD_REQUEST",
        applicationCode: "billing.seat_quantity_invalid",
      });
      expect(seats.purchaseLearnerSeats).not.toHaveBeenCalled();
    },
  );

  it.each([1, MAX_SEAT_PURCHASE])("accepts %s seats", async (quantity) => {
    await buy(quantity);

    expect(seats.purchaseLearnerSeats).toHaveBeenCalledWith(
      expect.objectContaining({ quantity }),
    );
  });

  it("refuses the quantity before it asks who is buying's subscription", async () => {
    await expect(buy(0)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.organizationSubscription.findUnique).not.toHaveBeenCalled();
  });
});

describe("LB8 — seats need a subscription to be a quantity on", () => {
  it.each([
    ["no subscription at all", null],
    ["a trial", { plan: "TRIAL" }],
    ["an internal organization", { plan: "INTERNAL" }],
    ["a cancelled subscription", { status: "CANCELED" }],
    ["a subscription Stripe does not know", { stripeSubscriptionId: null }],
  ])("refuses %s", async (_case, row) => {
    subscription(row);

    await expect(buy()).rejects.toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "billing.seats_unavailable",
    });
    expect(seats.purchaseLearnerSeats).not.toHaveBeenCalled();
  });

  it("sells to an organization behind on payment, which is what seats fix", async () => {
    subscription({ status: "PAST_DUE", pastDueSince: daysAgo(13) });

    await expect(buy()).resolves.toEqual({ purchasedSeats: 3 });
  });

  it("PL15: refuses once that organization's grace period has run out", async () => {
    subscription({ status: "PAST_DUE", pastDueSince: daysAgo(15) });

    await expect(buy()).rejects.toMatchObject({
      applicationCode: "billing.seats_unavailable",
    });
  });
});

describe("LB14 — a client that repeats itself does not repeat the charge", () => {
  it("stops the purchase once the organization's hourly budget is spent", async () => {
    counter.setSpent(
      ORG_ID,
      "billing.purchaseLearnerSeats",
      BILLING_PURCHASES_PER_HOUR,
    );

    await expect(buy()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      applicationCode: "rate_limit.exceeded",
    });
    expect(seats.purchaseLearnerSeats).not.toHaveBeenCalled();
  });

  it("counts against the organization, not the owner who happened to click", async () => {
    await buy();

    expect(counter.spent(ORG_ID, "billing.purchaseLearnerSeats")).toBe(1);
    expect(counter.spent(USER, "billing.purchaseLearnerSeats")).toBe(0);
  });
});

describe("LB8 — the card asks the predicate the purchase enforces", () => {
  it("agrees with the purchase on every case above", () => {
    expect(isSeatPurchasable(null)).toBe(false);
    expect(
      isSeatPurchasable({
        plan: "TRIAL",
        status: "ACTIVE",
        stripeSubscriptionId: "sub_1",
      } as never),
    ).toBe(false);
    expect(
      isSeatPurchasable({
        plan: "STARTER",
        status: "ACTIVE",
        stripeSubscriptionId: null,
      } as never),
    ).toBe(false);
    expect(
      isSeatPurchasable({
        plan: "STARTER",
        status: "ACTIVE",
        stripeSubscriptionId: "sub_1",
      } as never),
    ).toBe(true);
    expect(
      isSeatPurchasable({
        plan: "STARTER",
        status: "PAST_DUE",
        pastDueSince: daysAgo(15),
        stripeSubscriptionId: "sub_1",
      } as never),
    ).toBe(false);
  });
});

describe("LB13 — a quote is the purchase's own question", () => {
  const quote = (quantity = 100) =>
    previewSeatPurchase({ orgSlug: ORG_SLUG, userId: USER, quantity });

  it("passes an owner's question to Stripe with the plan it resolved", async () => {
    subscription({ plan: "BUSINESS", stripeSubscriptionId: "sub_9" });

    await quote(5);

    expect(seats.previewLearnerSeatPurchase).toHaveBeenCalledWith({
      plan: "BUSINESS",
      stripeSubscriptionId: "sub_9",
      quantity: 5,
    });
  });

  it("refuses an admin the price as it refuses them the purchase", async () => {
    memberRole("admin");

    await expect(quote()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(seats.previewLearnerSeatPurchase).not.toHaveBeenCalled();
  });

  it.each([0, 1.5, MAX_SEAT_PURCHASE + 1])(
    "refuses to price %s seats it would not sell",
    async (quantity) => {
      await expect(quote(quantity)).rejects.toMatchObject({
        code: "BAD_REQUEST",
        applicationCode: "billing.seat_quantity_invalid",
      });
      expect(seats.previewLearnerSeatPurchase).not.toHaveBeenCalled();
    },
  );

  it("refuses to price seats on a subscription that cannot carry them", async () => {
    subscription({ plan: "TRIAL" });

    await expect(quote()).rejects.toMatchObject({
      applicationCode: "billing.seats_unavailable",
    });
    expect(seats.previewLearnerSeatPurchase).not.toHaveBeenCalled();
  });

  it("quotes the recurring cost from the catalogue the card quotes from", async () => {
    await expect(quote()).resolves.toEqual({
      amountDueCents: 13_333,

      recurringCents: 20_000,
      seatsAfter: 100,
      periodEnd: null,
    });
  });

  it("prices the seats the organization ends up with, not the ones just asked for", async () => {
    seats.previewLearnerSeatPurchase.mockResolvedValue({
      amountDueCents: 500,
      seatsAfter: 7,
      periodEnd: null,
    });

    await expect(quote(3)).resolves.toMatchObject({ recurringCents: 1_400 });
  });

  it("sells nothing", async () => {
    await quote();

    expect(seats.purchaseLearnerSeats).not.toHaveBeenCalled();
  });
});

describe("LQ2 — the purchase is the request", () => {
  it("hands Stripe the organization and plan it resolved, and returns its answer", async () => {
    seats.purchaseLearnerSeats.mockResolvedValue({ purchasedSeats: 12 });
    subscription({ plan: "BUSINESS", stripeSubscriptionId: "sub_9" });

    await expect(buy(5)).resolves.toEqual({ purchasedSeats: 12 });
    expect(seats.purchaseLearnerSeats).toHaveBeenCalledWith({
      organizationId: ORG_ID,
      plan: "BUSINESS",
      stripeSubscriptionId: "sub_9",
      quantity: 5,
    });
  });
});
