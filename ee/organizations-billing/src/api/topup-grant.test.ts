import type { Prisma } from "@scibly/db";
import type Stripe from "stripe";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

// Tests both entry points a purchase can arrive by: the webhook and the return.

const db = vi.hoisted(() => ({
  creditLedgerEntry: { create: vi.fn() },
  organizationCredit: { updateMany: vi.fn() },
  $transaction: vi.fn(),
}));

const stripe = vi.hoisted(() => ({
  checkout: {
    sessions: { create: vi.fn(), retrieve: vi.fn(), listLineItems: vi.fn() },
  },
}));

const { SMALL_PRICE, LARGE_PRICE } = vi.hoisted(() => ({
  SMALL_PRICE: "price_test_topup_small",
  LARGE_PRICE: "price_test_topup_large",
}));

vi.mock("@scibly/db", async () => {
  const client = await import("@scibly/db/client");
  return { db, Prisma: client.Prisma };
});
// The Stripe singleton is built at import time, so the client module is the seam — doubling it also keeps the SDK from reaching Stripe in tests.
vi.mock("@scibly/ee-billing/stripe-client", () => ({
  stripeClient: stripe,
  stripeEnv: {
    STRIPE_PRICE_TOPUP_SMALL: SMALL_PRICE,
    STRIPE_PRICE_TOPUP_LARGE: LARGE_PRICE,
  },
}));

const prismaClient = await import("@scibly/db/client");
const {
  claimTopupCheckout,
  createTopupCheckoutSession,
  grantTopupOnStripeEvent,
} = await import("@scibly/ee-billing/topup");

const SESSION_ID = "cs_test_1";
const ORG = "org-1";
const BUYER = "user-owner";
const CUSTOMER = "cus_1";
const BILLING_URL = "/app/profile/org/acme/billing";

interface Session {
  id?: unknown;
  mode?: unknown;
  payment_status?: unknown;
  metadata?: unknown;
}

function paidSession(overrides: Session = {}) {
  return {
    id: SESSION_ID,
    mode: "payment",
    payment_status: "paid",
    metadata: {
      scibly_organization_id: ORG,
      scibly_topup_pack: "small",
      scibly_topup_buyer_id: BUYER,
    },
    ...overrides,
  };
}

function paidLineItems(...items: { price: string; quantity?: number }[]) {
  stripe.checkout.sessions.listLineItems.mockResolvedValue({
    data: items.map((item) => ({
      price: { id: item.price },
      quantity: item.quantity ?? 1,
    })),
  });
}

const deliverWebhook = (session: Session) =>
  grantTopupOnStripeEvent({
    type: "checkout.session.completed",
    data: { object: session },
  } as never);

const deliverSettlement = (session: Session) =>
  grantTopupOnStripeEvent({
    type: "checkout.session.async_payment_succeeded",
    data: { object: session },
  } as never);

function claimReturn(session: Session, organizationId = ORG) {
  stripe.checkout.sessions.retrieve.mockResolvedValue(session);
  return claimTopupCheckout({ sessionId: SESSION_ID, organizationId });
}

const ledgerData = () =>
  db.creditLedgerEntry.create.mock.calls[0]?.[0]?.data as
    | Prisma.CreditLedgerEntryCreateInput
    | undefined;

const creditData = () =>
  db.organizationCredit.updateMany.mock.calls[0]?.[0]?.data as
    | Prisma.OrganizationCreditUpdateManyMutationInput
    | undefined;

function uniqueViolation() {
  return new prismaClient.Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    { code: "P2002", clientVersion: "7.8.0" },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  transactionsRun(db);
  db.creditLedgerEntry.create.mockResolvedValue({});
  db.organizationCredit.updateMany.mockResolvedValue({ count: 1 });
  paidLineItems({ price: SMALL_PRICE });
});

describe("granting a paid top-up", () => {
  it("TG1: raises the top-up balance and records the purchase in the ledger", async () => {
    await deliverWebhook(paidSession());

    expect(ledgerData()).toMatchObject({
      organizationId: ORG,
      actorId: BUYER,
      action: "TOPUP_PURCHASE",
      creditsCharged: 250,
      bucket: "TOPUP",
    });
    expect(db.organizationCredit.updateMany).toHaveBeenCalledWith({
      where: { organizationId: ORG },
      data: {
        topupRemaining: { increment: 250 },
        notifiedAllowanceThreshold: 0,
      },
    });
  });

  it("AN8: the grant re-arms the allowance warnings it just answered", async () => {
    await deliverWebhook(paidSession());

    expect(creditData()).toMatchObject({ notifiedAllowanceThreshold: 0 });
  });

  it("TG1: writes nothing outside the transaction", async () => {
    db.$transaction.mockResolvedValue(undefined);

    await deliverWebhook(paidSession());

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
  });

  it("TG9: raises the balance by an increment rather than a computed total", async () => {
    await deliverWebhook(paidSession());

    const { data } = db.organizationCredit.updateMany.mock.calls[0]?.[0] as {
      data: { topupRemaining: unknown };
    };
    expect(data.topupRemaining).toEqual({ increment: 250 });
  });

  it("TG2: keys the ledger entry by the Stripe session", async () => {
    await deliverWebhook(paidSession());

    expect(ledgerData()?.id).toBe(`topup_${SESSION_ID}`);
  });

  it("TG2: a second delivery of the same session credits nothing", async () => {
    db.creditLedgerEntry.create.mockRejectedValue(uniqueViolation());

    await expect(deliverWebhook(paidSession())).resolves.toBeUndefined();
    expect(await claimReturn(paidSession())).toEqual({
      status: "already-granted",
    });
  });

  it("TG10: fails loudly when the organization has no credit row to raise", async () => {
    db.organizationCredit.updateMany.mockResolvedValue({ count: 0 });

    await expect(deliverWebhook(paidSession())).rejects.toThrow(
      /no credit row/,
    );
  });

  it("TG5: a completed session that is not paid grants nothing", async () => {
    await deliverWebhook(paidSession({ payment_status: "unpaid" }));

    expect(db.$transaction).not.toHaveBeenCalled();
    expect(stripe.checkout.sessions.listLineItems).not.toHaveBeenCalled();
  });

  it("TG11: the settlement TG5 refused to credit on is credited when it arrives", async () => {
    await deliverWebhook(paidSession({ payment_status: "unpaid" }));
    await deliverSettlement(paidSession());

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(ledgerData()).toMatchObject({ creditsCharged: 250 });
  });

  it("TG11: a settlement redelivered after the grant credits nothing", async () => {
    db.creditLedgerEntry.create.mockRejectedValue(uniqueViolation());

    await expect(deliverSettlement(paidSession())).resolves.toBeUndefined();
  });

  it("TG3: a subscription checkout raises the same event and is not ours", async () => {
    await deliverWebhook(paidSession({ mode: "subscription" }));

    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("TG3: an event that is not a completed checkout is ignored", async () => {
    await grantTopupOnStripeEvent({
      type: "invoice.paid",
      data: { object: paidSession() },
    } as never);

    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("TG1: a paid session carrying no top-up metadata grants nothing", async () => {
    await deliverWebhook(paidSession({ metadata: {} }));

    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("what a purchase is worth", () => {
  it("TP3: credits the pack that was paid for, times the quantity paid", async () => {
    paidLineItems({ price: LARGE_PRICE, quantity: 2 });

    await deliverWebhook(paidSession());

    expect(ledgerData()?.creditsCharged).toBe(2000);
  });

  it("TP3: reads the line items of the session that was paid", async () => {
    await deliverWebhook(paidSession());

    expect(stripe.checkout.sessions.listLineItems).toHaveBeenCalledWith(
      SESSION_ID,
      expect.anything(),
    );
  });

  it("TP4: a paid session for an unknown price credits nothing, and says so", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    paidLineItems({ price: "price_hand_built_in_the_dashboard" });

    const outcome = await claimReturn(paidSession());

    expect(outcome).toMatchObject({ status: "ignored" });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith(expect.stringContaining(SESSION_ID));
    logged.mockRestore();
  });
});

describe("claiming a purchase on the way back from Stripe", () => {
  it("TG4: retrieves the session from Stripe rather than trusting the URL", async () => {
    await claimReturn(paidSession());

    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith(SESSION_ID);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it("TG4: refuses to credit one organization with another's purchase", async () => {
    const outcome = await claimReturn(paidSession(), "org-2");

    expect(outcome).toMatchObject({ status: "ignored" });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("TG3: reports what was credited, so the page can say so", async () => {
    expect(await claimReturn(paidSession())).toEqual({
      status: "granted",
      credits: 250,
    });
  });
});

describe("the checkout an owner starts", () => {
  beforeEach(() => {
    stripe.checkout.sessions.create.mockResolvedValue({
      id: SESSION_ID,
      url: "https://checkout.stripe.test/pay",
    });
  });

  const startCheckout = (pack: "small" | "large" = "small") =>
    createTopupCheckoutSession({
      organizationId: ORG,
      buyerId: BUYER,
      pack,
      stripeCustomerId: CUSTOMER,
      returnUrl: BILLING_URL,
    });

  const createdParams = () =>
    stripe.checkout.sessions.create.mock
      .calls[0]?.[0] as Stripe.Checkout.SessionCreateParams;

  it("TC4: creates a one-off payment against the organization's customer", async () => {
    await startCheckout("large");

    expect(createdParams()).toMatchObject({
      mode: "payment",
      customer: CUSTOMER,
      line_items: [{ price: LARGE_PRICE, quantity: 1 }],
    });
  });

  it("TC4: carries the organization, pack and buyer in the session metadata", async () => {
    await startCheckout();

    const metadata = {
      scibly_organization_id: ORG,
      scibly_topup_pack: "small",
      scibly_topup_buyer_id: BUYER,
    };
    expect(createdParams()).toMatchObject({
      metadata,
      payment_intent_data: { metadata },
    });
  });

  it("TC5: collects VAT exactly as a subscription checkout does", async () => {
    await startCheckout();

    expect(createdParams()).toMatchObject({
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
    });
  });

  it("TC6: returns to the billing page, carrying the session id on success", async () => {
    await startCheckout();

    expect(createdParams()).toMatchObject({
      success_url: `${BILLING_URL}?topup={CHECKOUT_SESSION_ID}`,
      cancel_url: BILLING_URL,
    });
  });

  it("TC6: hands back the URL to send the owner to", async () => {
    await expect(startCheckout()).resolves.toBe(
      "https://checkout.stripe.test/pay",
    );
  });

  it("TC6: a session with no URL is a failure, not a dead button", async () => {
    stripe.checkout.sessions.create.mockResolvedValue({ id: SESSION_ID });

    await expect(startCheckout()).rejects.toThrow(/no URL/);
  });
});
