import { routes } from "@scibly/routes";
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

const stripe = vi.hoisted(() => ({
  createTopupCheckoutSession: vi.fn(),
  claimTopupCheckout: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@scibly/ee-billing/topup", () => stripe);

const { claimTopupPurchase, isTopupSellable, startTopupCheckout } =
  await import("./topup.operations");
const { BILLING_CLAIMS_PER_HOUR, BILLING_PURCHASES_PER_HOUR } =
  await import("./subscription-preconditions");

const ORG_SLUG = "acme";
const ORG_ID = "org-1";
const USER = "user-1";
const SESSION_ID = "cs_test_1";

function memberRole(role: string | null) {
  db.member.findFirst.mockResolvedValue(
    role === null ? null : { id: "m-1", role },
  );
}

function subscription(
  row: {
    plan?: string;
    status?: string;
    pastDueSince?: Date | null;
    stripeCustomerId?: string | null;
  } | null,
) {
  db.organizationSubscription.findUnique.mockResolvedValue(
    row === null
      ? null
      : {
          plan: row.plan ?? "STARTER",
          status: row.status ?? "ACTIVE",
          pastDueSince: row.pastDueSince ?? null,
          stripeCustomerId:
            row.stripeCustomerId === undefined ? "cus_1" : row.stripeCustomerId,
        },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  db.organization.findUnique.mockResolvedValue({ id: ORG_ID });

  counter.clear();
  memberRole("owner");
  subscription({});
  stripe.createTopupCheckoutSession.mockResolvedValue(
    "https://checkout.stripe.test/pay",
  );
  stripe.claimTopupCheckout.mockResolvedValue({
    status: "granted",
    credits: 250,
  });
});

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const buy = () =>
  startTopupCheckout({ orgSlug: ORG_SLUG, userId: USER, pack: "small" });

const claim = () =>
  claimTopupPurchase({
    orgSlug: ORG_SLUG,
    userId: USER,
    sessionId: SESSION_ID,
  });

describe("who may start a top-up checkout", () => {
  it("TC1: an owner may", async () => {
    await expect(buy()).resolves.toEqual({
      url: "https://checkout.stripe.test/pay",
    });
  });

  it("TC1/TC2: an admin is refused by the server, not merely by the card", async () => {
    memberRole("admin");

    await expect(buy()).rejects.toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "organization.role_required",
    });
    expect(stripe.createTopupCheckoutSession).not.toHaveBeenCalled();
  });

  it("TC1: a member is refused", async () => {
    memberRole("member");

    await expect(buy()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(stripe.createTopupCheckoutSession).not.toHaveBeenCalled();
  });

  it("TC1: someone outside the organization is refused", async () => {
    memberRole(null);

    await expect(buy()).rejects.toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "organization.access_denied",
    });
    expect(stripe.createTopupCheckoutSession).not.toHaveBeenCalled();
  });

  it("TC1: the same rule guards the claim on the way back (TG4)", async () => {
    memberRole("admin");

    await expect(claim()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(stripe.claimTopupCheckout).not.toHaveBeenCalled();
  });
});

describe("what the checkout is asked for", () => {
  it("TC4/TC6: sells one pack against the organization's customer, back to billing", async () => {
    await buy();

    expect(stripe.createTopupCheckoutSession).toHaveBeenCalledWith({
      organizationId: ORG_ID,
      buyerId: USER,
      pack: "small",
      stripeCustomerId: "cus_1",
      returnUrl: routes.app.profile.org(ORG_SLUG).billing,
    });
  });
});

describe("which organizations may be sold a top-up", () => {
  const sellable = (
    row: {
      plan?: string;
      status?: string;
      pastDueSince?: Date | null;
      stripeCustomerId?: string | null;
    } | null,
  ) =>
    isTopupSellable(
      row === null
        ? null
        : ({
            plan: row.plan ?? "STARTER",
            status: row.status ?? "ACTIVE",
            pastDueSince: row.pastDueSince ?? null,
            stripeCustomerId:
              row.stripeCustomerId === undefined
                ? "cus_1"
                : row.stripeCustomerId,
          } as never),
    );

  it("TC3: a subscribed organization on a paid plan may buy", () => {
    expect(sellable({ plan: "STARTER", status: "ACTIVE" })).toBe(true);
  });

  it("TC3/PL15: an organization inside its grace period may still buy, as it may still upgrade", () => {
    expect(
      sellable({
        plan: "BUSINESS",
        status: "PAST_DUE",
        pastDueSince: daysAgo(13),
      }),
    ).toBe(true);
  });

  it("PL15: an organization past its grace period may not — it may not generate either", () => {
    expect(
      sellable({
        plan: "BUSINESS",
        status: "PAST_DUE",
        pastDueSince: daysAgo(15),
      }),
    ).toBe(false);
  });

  it("TC3: an organization that never subscribed may not", () => {
    expect(sellable(null)).toBe(false);
    expect(sellable({ stripeCustomerId: null })).toBe(false);
  });

  it("TC3: a trial may not — buying would create the customer the plan card reads", () => {
    expect(sellable({ plan: "TRIAL" })).toBe(false);
  });

  it("TC3: an internal organization may not", () => {
    expect(sellable({ plan: "INTERNAL" })).toBe(false);
  });

  it("TC3: a canceled subscription may not", () => {
    expect(sellable({ status: "CANCELED" })).toBe(false);
  });

  it("TC3/TU3: an owner who cannot be sold one is refused before Stripe is asked", async () => {
    subscription({ plan: "TRIAL" });

    await expect(buy()).rejects.toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "billing.topup_unavailable",
    });
    expect(stripe.createTopupCheckoutSession).not.toHaveBeenCalled();
  });
});

describe("claiming a purchase on the way back", () => {
  it("TG4: claims against the organization the slug resolves to", async () => {
    await claim();

    expect(stripe.claimTopupCheckout).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      organizationId: ORG_ID,
    });
  });

  it("TG3: a grant this call made is reported as granted", async () => {
    await expect(claim()).resolves.toEqual({ granted: true });
  });

  it("TG3: the webhook having won the race is a success too", async () => {
    stripe.claimTopupCheckout.mockResolvedValue({ status: "already-granted" });

    await expect(claim()).resolves.toEqual({ granted: true });
  });

  it("TG4: a session that credited nothing is not reported as a purchase", async () => {
    stripe.claimTopupCheckout.mockResolvedValue({
      status: "ignored",
      reason: "belongs to another organization",
    });

    await expect(claim()).resolves.toEqual({ granted: false });
  });
});

describe("TC7 — neither call reaches Stripe unthrottled", () => {
  it("stops a checkout once the organization's hourly budget is spent", async () => {
    counter.setSpent(
      ORG_ID,
      "billing.startTopupCheckout",
      BILLING_PURCHASES_PER_HOUR,
    );

    await expect(buy()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      applicationCode: "rate_limit.exceeded",
    });
    expect(stripe.createTopupCheckoutSession).not.toHaveBeenCalled();
  });

  it("stops a claim on its own, looser budget", async () => {
    counter.setSpent(
      ORG_ID,
      "billing.claimTopupPurchase",
      BILLING_CLAIMS_PER_HOUR,
    );

    await expect(claim()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(stripe.claimTopupCheckout).not.toHaveBeenCalled();
  });

  it("counts the two separately, so a reloaded return spends no checkout budget", async () => {
    await buy();
    await claim();

    expect(counter.spent(ORG_ID, "billing.startTopupCheckout")).toBe(1);
    expect(counter.spent(ORG_ID, "billing.claimTopupPurchase")).toBe(1);
  });
});
