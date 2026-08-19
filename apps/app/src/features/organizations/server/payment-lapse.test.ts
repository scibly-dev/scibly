import type * as DbModule from "@scibly/db";
import type { Prisma } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { PAYMENT_GRACE_DAYS } from "@scibly/ee-billing/plan-catalogue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionsRun } from "@/shared/testing/prisma-transaction";

// The plan catalogue is real: the grace period is one of its constants, and
// a doubled one would prove nothing about the fourteen days a customer gets.
const db = vi.hoisted(() => ({
  organizationSubscription: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  organizationCredit: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  creditLedgerEntry: { create: vi.fn(), update: vi.fn() },
  organization: { updateMany: vi.fn() },
  organizationAIModel: { updateMany: vi.fn() },
  courseEnrollment: { findMany: vi.fn() },
  anonymousCourseSession: { count: vi.fn() },
  $transaction: vi.fn(),
}));

/** The warning `chargeGenerationAndWarn` schedules is covered elsewhere;
 * here it only has to not run. */
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db,
}));

const { db: mockedDb } = await import("@scibly/db");
const {
  assertAllowed,
  chargeAiGeneration,
  decideAnonymousSession,
  decideCoursePublishing,
  decideEnrollment,
  describePaymentState,
  graceEndsAt,
  hasLapsed,
  notLapsedSubscription,
} = await import("@scibly/api/entitlement");
const { syncSubscription } =
  await import("@scibly/ee-billing/sync-subscription");
const { assertGenerationAllowed, chargeGenerationAndWarn } =
  await import("./charge-generation");

const ORG = "org-1";
const ACTOR = "user-1";
const NOW = new Date("2026-08-20T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const context = { db: mockedDb, organizationId: ORG, actorId: ACTOR };

const daysBeforeNow = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

function subscribed(status: string, pastDueSince: Date | null = null) {
  db.organizationSubscription.findUnique.mockResolvedValue({
    plan: "BUSINESS",
    status,
    pastDueSince,
    purchasedLearnerSeats: 0,
    currentPeriodStart: new Date("2026-08-01T00:00:00Z"),
  });
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("expected the action to be refused, but it resolved");
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  transactionsRun(db);
  subscribed("ACTIVE");
  db.organizationCredit.updateMany.mockResolvedValue({ count: 1 });
  db.organizationCredit.findUnique.mockResolvedValue({
    periodStart: new Date("2026-08-01T00:00:00.000Z"),
  });
  db.creditLedgerEntry.create.mockResolvedValue({ id: "entry-1" });

  db.anonymousCourseSession.count.mockResolvedValue(0);
});

describe("PL7/PL8 — the rule, and the fourteen days in it", () => {
  const lapsedAfter = (days: number) =>
    hasLapsed({ status: "PAST_DUE", pastDueSince: daysBeforeNow(days) }, NOW);

  it("PL7: a canceled subscription is lapsed the moment it is canceled", () => {
    expect(hasLapsed({ status: "CANCELED", pastDueSince: null }, NOW)).toBe(
      true,
    );
  });

  it("PL7: an active subscription never is, whatever the clock says", () => {
    expect(
      hasLapsed({ status: "ACTIVE", pastDueSince: daysBeforeNow(90) }, NOW),
    ).toBe(false);
  });

  it("PL7/PL8: a failed payment lapses on the fourteenth day and not before", () => {
    expect(lapsedAfter(0)).toBe(false);
    expect(lapsedAfter(PAYMENT_GRACE_DAYS - 1)).toBe(false);
    expect(lapsedAfter(PAYMENT_GRACE_DAYS)).toBe(true);
    expect(lapsedAfter(PAYMENT_GRACE_DAYS + 30)).toBe(true);
  });

  it("PL5: a past-due row with no clock is in grace, not lapsed — our missing data is not the customer's problem", () => {
    expect(hasLapsed({ status: "PAST_DUE", pastDueSince: null }, NOW)).toBe(
      false,
    );
  });

  it("PL8: the deadline is the clock plus the catalogue's constant, not a number written here", () => {
    const started = daysBeforeNow(3);

    expect(graceEndsAt(started).getTime()).toBe(
      started.getTime() + PAYMENT_GRACE_DAYS * DAY_MS,
    );
  });
});

describe("PL11 — the three states a surface may report", () => {
  it("names a paying organization current, with no deadline to show", () => {
    expect(
      describePaymentState({ status: "ACTIVE", pastDueSince: null }, NOW),
    ).toEqual({ state: "current", graceEndsAt: null });
  });

  it("PG3: names the grace period and the date it runs out", () => {
    const started = daysBeforeNow(2);

    expect(
      describePaymentState({ status: "PAST_DUE", pastDueSince: started }, NOW),
    ).toEqual({ state: "grace", graceEndsAt: graceEndsAt(started) });
  });

  it("PG4: names the lapse, and offers no deadline once it has passed", () => {
    expect(
      describePaymentState(
        { status: "PAST_DUE", pastDueSince: daysBeforeNow(20) },
        NOW,
      ),
    ).toEqual({ state: "lapsed", graceEndsAt: null });
    expect(
      describePaymentState({ status: "CANCELED", pastDueSince: null }, NOW),
    ).toEqual({ state: "lapsed", graceEndsAt: null });
  });
});

describe("PL14 — the same rule, asked of a query instead of a row", () => {
  const matches = (row: { status: string; pastDueSince: Date | null }) =>
    notLapsedSubscription(NOW).OR!.some((clause) => {
      const branch = clause as {
        status: string;
        OR?: { pastDueSince: null | { gt: Date } }[];
      };
      if (branch.status !== row.status) return false;
      if (!branch.OR) return true;
      return branch.OR.some((clock) =>
        clock.pastDueSince === null
          ? row.pastDueSince === null
          : row.pastDueSince !== null &&
            row.pastDueSince.getTime() > clock.pastDueSince.gt.getTime(),
      );
    });

  it("selects exactly the organizations `hasLapsed` would let act", () => {
    const rows = [
      { status: "ACTIVE", pastDueSince: null },
      { status: "CANCELED", pastDueSince: null },
      { status: "PAST_DUE", pastDueSince: null },
      { status: "PAST_DUE", pastDueSince: daysBeforeNow(1) },
      { status: "PAST_DUE", pastDueSince: daysBeforeNow(PAYMENT_GRACE_DAYS) },
      { status: "PAST_DUE", pastDueSince: daysBeforeNow(40) },
    ];

    for (const row of rows) {
      expect([row.status, row.pastDueSince, matches(row)]).toEqual([
        row.status,
        row.pastDueSince,
        !hasLapsed(row as never, NOW),
      ]);
    }
  });
});

describe("PL13/PL16 — grace keeps everything, the lapse withdraws it", () => {
  const publish = async () => {
    assertAllowed(
      await decideCoursePublishing(context.db, context.organizationId),
    );
    return "v1";
  };
  const enroll = async () => {
    assertAllowed(
      await decideEnrollment(mockedDb, ORG, { candidateUserIds: [] }),
    );
    return "in";
  };

  it("PL13: a failed payment changes nothing for the first fourteen days", async () => {
    subscribed("PAST_DUE", daysBeforeNow(PAYMENT_GRACE_DAYS - 1));

    await expect(publish()).resolves.toBe("v1");
    await expect(enroll()).resolves.toBe("in");
  });

  it("PL16: the same gates refuse once grace has run out, naming the lapse", async () => {
    subscribed("PAST_DUE", daysBeforeNow(PAYMENT_GRACE_DAYS));

    const stopped = await refusal(publish);
    expect(stopped.code).toBe("PAYMENT_REQUIRED");
    expect(stopped.details).toMatchObject({ reason: "lapsed" });
    expect(stopped.message).toMatch(/lapsed/i);
    expect((await refusal(enroll)).message).toMatch(/lapsed/i);
  });

  it("PL22: refusing writes nothing — no row changes when grace expires", async () => {
    subscribed("PAST_DUE", daysBeforeNow(30));

    await refusal(publish);

    expect(db.organizationSubscription.update).not.toHaveBeenCalled();
    expect(db.organizationSubscription.updateMany).not.toHaveBeenCalled();
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
  });

  it("PL23: restoring payment permits the next action, with nothing to replay", async () => {
    subscribed("PAST_DUE", daysBeforeNow(30));
    await refusal(publish);

    subscribed("ACTIVE");

    await expect(publish()).resolves.toBe("v1");
  });
});

describe("PL17/PL18 — generations stop on every endpoint", () => {
  const charge = (byoai: boolean) =>
    byoai
      ? assertGenerationAllowed({ db: mockedDb, organizationId: ORG }).then(
          () => "generated" as const,
        )
      : chargeGenerationAndWarn(
          {
            db: mockedDb,
            organizationId: ORG,
            actorId: ACTOR,
            action: "CHAT_MESSAGE",
          },
          async () => "generated",
        );

  it("PL13: both endpoints keep generating inside grace", async () => {
    subscribed("PAST_DUE", daysBeforeNow(1));

    await expect(charge(false)).resolves.toBe("generated");
    await expect(charge(true)).resolves.toBe("generated");
  });

  it("PL17: the debit refuses in the seam, so no charge site can spend a lapsed allowance", async () => {
    subscribed("PAST_DUE", daysBeforeNow(20));
    const generate = vi.fn(async () => "never");

    const error = await refusal(() =>
      chargeAiGeneration(
        {
          db: mockedDb,
          organizationId: ORG,
          actorId: ACTOR,
          action: "CHAT_MESSAGE",
        },
        generate,
      ),
    );

    expect(error.applicationCode).toBe(
      "entitlement.generations_require_subscription",
    );
    expect(generate).not.toHaveBeenCalled();

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
  });

  it("PL18: a turn on the organization's own endpoint is refused too, though it costs nothing", async () => {
    subscribed("PAST_DUE", daysBeforeNow(20));

    const error = await refusal(() => charge(true));

    expect(error.applicationCode).toBe(
      "entitlement.generations_require_subscription",
    );
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
  });

  it("PL17/PL18: both refusals say the same thing, because they are the same sentence", async () => {
    subscribed("CANCELED");

    const byoai = await refusal(() => charge(true));
    const metered = await refusal(() => charge(false));

    expect(byoai.message).toBe(metered.message);
    expect(byoai.message).toMatch(/already created stays where it is/i);
  });

  it("PL18: the gate is the whole of what BYOAI skips — it never debits", async () => {
    subscribed("ACTIVE");

    await expect(
      assertGenerationAllowed(context).then(() => "generated"),
    ).resolves.toBe("generated");
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
  });
});

describe("PL19/PL20 — new public sessions stop, without saying why", () => {
  const start = async () => {
    assertAllowed(await decideAnonymousSession(mockedDb, ORG));
    return "session";
  };

  it("PL13: a visitor may still start one inside grace", async () => {
    subscribed("PAST_DUE", daysBeforeNow(13));

    await expect(start()).resolves.toBe("session");
  });

  it("PL20: refuses as unavailability — no plan, no lapse, no number", async () => {
    subscribed("PAST_DUE", daysBeforeNow(15));

    const error = await refusal(start);

    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.applicationCode).toBe("entitlement.public_sessions_exhausted");
    expect(error.message).toBe("This course is not available right now.");
    expect(error.message).not.toMatch(/lapse|payment|plan|subscription/i);
  });
});

describe("PL2/PL3/PL4 — the clock, written once per lapse", () => {
  const sync = (status: string) =>
    syncSubscription(mockedDb, {
      id: "bookkeeping-1",
      plan: "business",
      referenceId: ORG,
      status,
      periodStart: new Date("2026-08-01T00:00:00Z"),
      periodEnd: new Date("2026-09-01T00:00:00Z"),
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
    } as never);

  const clockWrite = () =>
    db.organizationSubscription.updateMany.mock.calls[0]?.[0];
  const statusWrite = () =>
    db.organizationSubscription.update.mock.calls[0]?.[0]?.data as
      | Prisma.OrganizationSubscriptionUpdateInput
      | undefined;

  beforeEach(() => {
    db.organizationCredit.findUnique.mockResolvedValue({
      periodStart: new Date("2026-08-01T00:00:00Z"),
    });
    db.organizationCredit.update.mockResolvedValue({});
    db.organizationSubscription.update.mockResolvedValue({});
    db.organizationSubscription.updateMany.mockResolvedValue({ count: 1 });
    db.organization.updateMany.mockResolvedValue({ count: 0 });
    db.organizationAIModel.updateMany.mockResolvedValue({ count: 0 });
  });

  it("PL2/PL3: starts the clock on the guarded write, so a redelivery cannot push the deadline out", async () => {
    await sync("past_due");

    expect(clockWrite()).toEqual({
      where: { organizationId: ORG, pastDueSince: null },
      data: { pastDueSince: NOW },
    });
  });

  it("PL4: recovery clears the clock in the same write that clears the status", async () => {
    await sync("active");

    expect(statusWrite()).toMatchObject({
      status: "ACTIVE",
      pastDueSince: null,
    });
    expect(db.organizationSubscription.updateMany).not.toHaveBeenCalled();
  });

  it("PL4: cancelling clears it too — a canceled row is lapsed by status alone", async () => {
    await sync("canceled");

    expect(statusWrite()).toMatchObject({
      status: "CANCELED",
      pastDueSince: null,
    });
  });

  it("PL3: entering past-due leaves the status write's clock alone, so the guard decides", async () => {
    await sync("past_due");

    expect(statusWrite()).toMatchObject({ status: "PAST_DUE" });
    expect(statusWrite()?.pastDueSince).toBeUndefined();
  });
});
