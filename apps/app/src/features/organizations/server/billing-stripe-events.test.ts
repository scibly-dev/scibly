import type Stripe from "stripe";

import { beforeEach, describe, expect, it, vi } from "vitest";

// Covers what `syncSubscription`'s own tests can't: that a throw survives the caller.
const db = vi.hoisted(() => ({
  subscription: { findUnique: vi.fn() },
}));
const topup = vi.hoisted(() => ({ grantTopupOnStripeEvent: vi.fn() }));
const sync = vi.hoisted(() => ({ syncSubscription: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@scibly/ee-billing/topup", () => topup);
vi.mock("@scibly/ee-billing/sync-subscription", () => sync);

const { db: mockedDb } = await import("@scibly/db");
const { onStripeEvent } = await import("@scibly/ee-billing/stripe-events");

const STORED_ROW = {
  id: "bookkeeping-1",
  plan: "starter",
  referenceId: "org-1",
  status: "active",
  periodStart: new Date("2026-02-01T00:00:00Z"),
  periodEnd: new Date("2026-03-01T00:00:00Z"),
  stripeCustomerId: "cus_1",
  stripeSubscriptionId: "sub_1",
};

const subscriptionEvent = (
  type: Stripe.Event["type"],
  id = "sub_1",
): Stripe.Event =>
  ({ type, data: { object: { id } } }) as unknown as Stripe.Event;

const checkoutEvent = (subscription: string | null): Stripe.Event =>
  ({
    type: "checkout.session.completed",
    data: { object: { id: "cs_1", mode: "payment", subscription } },
  }) as unknown as Stripe.Event;

beforeEach(() => {
  vi.resetAllMocks();
  db.subscription.findUnique.mockResolvedValue(STORED_ROW);
  topup.grantTopupOnStripeEvent.mockResolvedValue(undefined);
  sync.syncSubscription.mockResolvedValue(undefined);
});

describe("SS13 — projecting from the stored row", () => {
  it("SS13: reads the plugin's row by the event's subscription id and projects it", async () => {
    await onStripeEvent(subscriptionEvent("customer.subscription.updated"));

    expect(db.subscription.findUnique).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: "sub_1" },
    });
    expect(sync.syncSubscription).toHaveBeenCalledWith(mockedDb, STORED_ROW);
  });

  it("SS13: created and deleted funnel through the same projection", async () => {
    await onStripeEvent(subscriptionEvent("customer.subscription.created"));
    await onStripeEvent(subscriptionEvent("customer.subscription.deleted"));

    expect(sync.syncSubscription).toHaveBeenCalledTimes(2);
  });

  it("SS13: a subscription checkout projects the subscription it created", async () => {
    await onStripeEvent(checkoutEvent("sub_1"));

    expect(db.subscription.findUnique).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: "sub_1" },
    });
    expect(sync.syncSubscription).toHaveBeenCalledTimes(1);
  });

  it("SS13: a row the plugin never stored is not an error", async () => {
    db.subscription.findUnique.mockResolvedValue(null);

    await expect(
      onStripeEvent(subscriptionEvent("customer.subscription.updated")),
    ).resolves.toBeUndefined();
    expect(sync.syncSubscription).not.toHaveBeenCalled();
  });

  it("SS13: an event about nothing we project is left alone", async () => {
    await onStripeEvent(subscriptionEvent("invoice.paid"));

    expect(db.subscription.findUnique).not.toHaveBeenCalled();
    expect(sync.syncSubscription).not.toHaveBeenCalled();
  });
});

describe("SS14 — a failed projection reaches Stripe", () => {
  it("SS14: the rejection propagates, so the webhook fails and is redelivered", async () => {
    sync.syncSubscription.mockRejectedValue(
      new Error("Stripe sync: organization org-1 has no credit row."),
    );

    await expect(
      onStripeEvent(subscriptionEvent("customer.subscription.updated")),
    ).rejects.toThrow(/no credit row/i);
  });

  it("SS14/TG10: a failed top-up grant propagates too, and stops the projection", async () => {
    topup.grantTopupOnStripeEvent.mockRejectedValue(new Error("grant lost"));

    await expect(onStripeEvent(checkoutEvent("sub_1"))).rejects.toThrow(
      /grant lost/,
    );
    expect(sync.syncSubscription).not.toHaveBeenCalled();
  });
});

describe("SS15 — redelivery", () => {
  it("SS15: a redelivered event re-reads the current row and projects again", async () => {
    const event = subscriptionEvent("customer.subscription.updated");

    await onStripeEvent(event);
    await onStripeEvent(event);

    expect(db.subscription.findUnique).toHaveBeenCalledTimes(2);
    expect(sync.syncSubscription).toHaveBeenNthCalledWith(
      2,
      mockedDb,
      STORED_ROW,
    );
  });
});

describe("SS16 — a top-up is not a subscription", () => {
  it("SS16: the grant runs and no projection is attempted", async () => {
    await onStripeEvent(checkoutEvent(null));

    expect(topup.grantTopupOnStripeEvent).toHaveBeenCalledTimes(1);
    expect(db.subscription.findUnique).not.toHaveBeenCalled();
    expect(sync.syncSubscription).not.toHaveBeenCalled();
  });
});
