import { beforeEach, describe, expect, it, vi } from "vitest";

// Stripe and the database are doubled; nothing else is.

const db = vi.hoisted(() => ({
  organizationSubscription: { update: vi.fn() },
}));

const stripe = vi.hoisted(() => ({
  subscriptions: { retrieve: vi.fn() },
  subscriptionItems: { create: vi.fn(), update: vi.fn() },
  invoices: { createPreview: vi.fn() },
}));

const { STARTER_SEAT, BUSINESS_SEAT, PRO_SEAT } = vi.hoisted(() => ({
  STARTER_SEAT: "price_test_seat_starter",
  BUSINESS_SEAT: "price_test_seat_business",
  PRO_SEAT: "price_test_seat_pro",
}));

vi.mock("@scibly/db", () => ({ db }));
// The Stripe singleton is built at import time, so the client module is the seam.
vi.mock("@scibly/ee-billing/stripe-client", () => ({
  stripeClient: stripe,
  stripeEnv: {
    STRIPE_PRICE_SEAT_STARTER: STARTER_SEAT,
    STRIPE_PRICE_SEAT_BUSINESS: BUSINESS_SEAT,
    STRIPE_PRICE_SEAT_PRO: PRO_SEAT,
  },
}));

const { previewLearnerSeatPurchase, purchaseLearnerSeats } =
  await import("@scibly/ee-billing/seats");

const ORG = "org-1";
const SUBSCRIPTION = "sub_1";

function subscriptionItems(
  items: { id: string; price: string; quantity: number }[],
) {
  stripe.subscriptions.retrieve.mockResolvedValue({
    items: {
      data: items.map((item) => ({
        id: item.id,
        price: { id: item.price },
        quantity: item.quantity,
      })),
    },
  });
}

const PLAN_ITEM = {
  id: "si_plan",
  price: "price_test_plan_starter",
  quantity: 1,
};
const SEAT_ITEM = { id: "si_seats", price: STARTER_SEAT, quantity: 4 };

beforeEach(() => {
  vi.clearAllMocks();
  subscriptionItems([PLAN_ITEM]);
  stripe.subscriptionItems.create.mockImplementation((params) =>
    Promise.resolve({ id: "si_seats", quantity: params.quantity }),
  );
  stripe.subscriptionItems.update.mockImplementation((id, params) =>
    Promise.resolve({ id, quantity: params.quantity }),
  );
  db.organizationSubscription.update.mockResolvedValue({});
});

const buy = (quantity: number, plan = "STARTER") =>
  purchaseLearnerSeats({
    organizationId: ORG,
    plan: plan as never,
    stripeSubscriptionId: SUBSCRIPTION,
    quantity,
  });

describe("LB3 — seats are a quantity on the plan's own subscription", () => {
  it("adds a seat item to the subscription that already exists", async () => {
    await buy(3);

    expect(stripe.subscriptionItems.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription: SUBSCRIPTION,
        price: STARTER_SEAT,
        quantity: 3,
      }),
      expect.anything(),
    );
  });

  it("prices seats by the plan, not by one shared rate", async () => {
    await buy(3, "PRO");

    expect(stripe.subscriptionItems.create).toHaveBeenCalledWith(
      expect.objectContaining({ price: PRO_SEAT }),
      expect.anything(),
    );
  });

  it("LB1: refuses a plan the catalogue sells no seats on", async () => {
    await expect(buy(3, "TRIAL")).rejects.toThrow(
      /does not sell learner seats/,
    );
    expect(stripe.subscriptionItems.create).not.toHaveBeenCalled();
  });
});

describe("LB4/LB6 — a second purchase raises the item it already has", () => {
  beforeEach(() => subscriptionItems([PLAN_ITEM, SEAT_ITEM]));

  it("adds to the existing quantity rather than starting a second line", async () => {
    await buy(3);

    expect(stripe.subscriptionItems.create).not.toHaveBeenCalled();
    expect(stripe.subscriptionItems.update).toHaveBeenCalledWith(
      SEAT_ITEM.id,
      expect.objectContaining({ quantity: 7 }),
      expect.anything(),
    );
  });

  it("LB6: re-prices seats bought on a former plan instead of duplicating them", async () => {
    await buy(1, "BUSINESS");

    expect(stripe.subscriptionItems.update).toHaveBeenCalledWith(
      SEAT_ITEM.id,
      expect.objectContaining({ price: BUSINESS_SEAT, quantity: 5 }),
      expect.anything(),
    );
  });
});

describe("LB5 — the rest of the period is charged now", () => {
  it("invoices the first seats immediately rather than deferring them", async () => {
    await buy(3);

    expect(stripe.subscriptionItems.create).toHaveBeenCalledWith(
      expect.objectContaining({ proration_behavior: "always_invoice" }),
      expect.anything(),
    );
  });

  it("charges further seats the same way", async () => {
    subscriptionItems([PLAN_ITEM, SEAT_ITEM]);

    await buy(3);

    expect(stripe.subscriptionItems.update).toHaveBeenCalledWith(
      SEAT_ITEM.id,
      expect.objectContaining({ proration_behavior: "always_invoice" }),
      expect.anything(),
    );
  });
});

describe("LB15 — a resubmitted purchase is one charge", () => {
  const keyUsed = () =>
    (
      stripe.subscriptionItems.create.mock.calls[0]?.[1] ??
      stripe.subscriptionItems.update.mock.calls[0]?.[2]
    )?.idempotencyKey;

  it("asks the same question twice when the click is sent twice", async () => {
    await buy(3);
    const first = keyUsed();
    vi.clearAllMocks();
    subscriptionItems([PLAN_ITEM]);

    await buy(3);

    expect(keyUsed()).toBe(first);
  });

  it("asks a different question once the seats it bought are there", async () => {
    await buy(3);
    const first = keyUsed();
    vi.clearAllMocks();

    subscriptionItems([PLAN_ITEM, { ...SEAT_ITEM, quantity: 3 }]);

    await buy(3);

    expect(keyUsed()).not.toBe(first);
  });

  it("does not carry one organization's key to another's subscription", async () => {
    await buy(3);
    const first = keyUsed();
    vi.clearAllMocks();
    subscriptionItems([PLAN_ITEM]);

    await purchaseLearnerSeats({
      organizationId: "org-2",
      plan: "STARTER" as never,
      stripeSubscriptionId: SUBSCRIPTION,
      quantity: 3,
    });

    expect(keyUsed()).not.toBe(first);
  });

  it("LB6: re-pricing to another plan is not the purchase it replaces", async () => {
    subscriptionItems([PLAN_ITEM, SEAT_ITEM]);
    await buy(1);
    const first = keyUsed();
    vi.clearAllMocks();
    subscriptionItems([PLAN_ITEM, SEAT_ITEM]);

    await buy(1, "BUSINESS");

    expect(keyUsed()).not.toBe(first);
  });
});

describe("LB12 — the price quoted is Stripe's answer to this exact change", () => {
  const previewOf = (
    lines: { amount: number; proration: boolean; end?: number }[],
  ) =>
    stripe.invoices.createPreview.mockResolvedValue({
      lines: {
        data: lines.map((line) => ({
          amount: line.amount,
          period: { start: 0, end: line.end ?? 0 },
          parent: {
            subscription_item_details: { proration: line.proration },
          },
        })),
      },
    });

  const quote = (quantity: number, plan = "STARTER") =>
    previewLearnerSeatPurchase({
      plan: plan as never,
      stripeSubscriptionId: SUBSCRIPTION,
      quantity,
    });

  it("asks for the item change the purchase would make, on the seats it would end up with", async () => {
    subscriptionItems([PLAN_ITEM, SEAT_ITEM]);
    previewOf([{ amount: 500, proration: true }]);

    await quote(3);

    expect(stripe.invoices.createPreview).toHaveBeenCalledWith({
      subscription: SUBSCRIPTION,
      subscription_details: {
        items: [{ id: SEAT_ITEM.id, price: STARTER_SEAT, quantity: 7 }],
        proration_behavior: "always_invoice",
      },
    });
  });

  it("asks for a new line when there are no seats yet", async () => {
    previewOf([{ amount: 500, proration: true }]);

    await quote(3);

    expect(stripe.invoices.createPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_details: expect.objectContaining({
          items: [{ price: STARTER_SEAT, quantity: 3 }],
        }),
      }),
    );
  });

  it("quotes what is prorated, not what the subscription costs next period", async () => {
    previewOf([
      { amount: 13_333, proration: true },
      { amount: 20_000, proration: false },
    ]);

    await expect(quote(100)).resolves.toEqual(
      expect.objectContaining({ amountDueCents: 13_333, seatsAfter: 100 }),
    );
  });

  it("adds up every proration, including a credit against it", async () => {
    previewOf([
      { amount: 13_333, proration: true },
      { amount: -1_000, proration: true },
    ]);

    await expect(quote(100)).resolves.toEqual(
      expect.objectContaining({ amountDueCents: 12_333 }),
    );
  });

  it("reports the day the pro-rata period runs to", async () => {
    previewOf([{ amount: 13_333, proration: true, end: 1_760_000_000 }]);

    await expect(quote(100)).resolves.toEqual(
      expect.objectContaining({ periodEnd: new Date(1_760_000_000 * 1000) }),
    );
  });

  it("says nothing about a date Stripe did not give", async () => {
    previewOf([]);

    await expect(quote(100)).resolves.toEqual(
      expect.objectContaining({ amountDueCents: 0, periodEnd: null }),
    );
  });

  it("sells nothing and writes nothing", async () => {
    previewOf([{ amount: 13_333, proration: true }]);

    await quote(100);

    expect(stripe.subscriptionItems.create).not.toHaveBeenCalled();
    expect(stripe.subscriptionItems.update).not.toHaveBeenCalled();
    expect(db.organizationSubscription.update).not.toHaveBeenCalled();
  });
});

describe("LQ1/LQ5 — the row mirrors the invoice", () => {
  it("writes the quantity Stripe reports, not the one we asked for", async () => {
    stripe.subscriptionItems.create.mockResolvedValue({ quantity: 2 });

    await expect(buy(3)).resolves.toEqual({ purchasedSeats: 2 });
    expect(db.organizationSubscription.update).toHaveBeenCalledWith({
      where: { organizationId: ORG },
      data: { purchasedLearnerSeats: 2 },
    });
  });

  it("sets the total absolutely, so a repeated purchase cannot double-count", async () => {
    subscriptionItems([PLAN_ITEM, SEAT_ITEM]);

    await buy(3);

    expect(db.organizationSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { purchasedLearnerSeats: 7 } }),
    );
  });
});

describe("LQ3 — a failed purchase writes nothing", () => {
  it("leaves the cap where it was when Stripe refuses", async () => {
    stripe.subscriptionItems.create.mockRejectedValue(
      new Error("card_declined"),
    );

    await expect(buy(3)).rejects.toThrow("card_declined");
    expect(db.organizationSubscription.update).not.toHaveBeenCalled();
  });

  it("leaves the cap where it was when the subscription cannot be read", async () => {
    stripe.subscriptions.retrieve.mockRejectedValue(new Error("no such sub"));

    await expect(buy(3)).rejects.toThrow("no such sub");
    expect(db.organizationSubscription.update).not.toHaveBeenCalled();
  });
});
