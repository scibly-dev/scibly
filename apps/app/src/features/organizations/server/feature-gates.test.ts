import { AppError } from "@scibly/api/application-error";
import { GENERATIONS_LAPSED } from "@scibly/api/entitlement/codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The plan catalogue is real — which plan buys which feature is the whole subject. Only the database is doubled.
const db = vi.hoisted(() => ({
  organizationSubscription: { findUnique: vi.fn() },
  courseEnrollment: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
  organizationCredit: { updateMany: vi.fn(), findUnique: vi.fn() },
  creditLedgerEntry: { create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));

const { db: mockedDb } = await import("@scibly/db");
const {
  assertAllowed,
  decideByoaiConfiguration,
  decideCoursePublishing,
  decideEnrollment,
  decideOwnEndpointGeneration,
} = await import("@scibly/api/entitlement");

const ORG = "org-a";
const ADMIN = "user-admin";

const context = { db: mockedDb, organizationId: ORG, actorId: ADMIN };

async function configureByoai<T>(operation: () => Promise<T>) {
  assertAllowed(
    await decideByoaiConfiguration(context.db, context.organizationId),
  );
  return operation();
}

async function publishCourse<T>(operation: () => Promise<T>) {
  assertAllowed(
    await decideCoursePublishing(context.db, context.organizationId),
  );
  return operation();
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

function onPlan(plan: string | null, status = "ACTIVE") {
  db.organizationSubscription.findUnique.mockResolvedValue(
    plan === null ? null : { plan, status, purchasedLearnerSeats: 0 },
  );
}

function noLearnersYet() {
  db.$queryRaw.mockResolvedValue([{ count: 0 }]);
  db.courseEnrollment.findMany.mockResolvedValue([]);
}

beforeEach(() => {
  vi.resetAllMocks();
  onPlan("BUSINESS");
});

describe("FG1 — the plan decides, read at enforcement time", () => {
  it("refuses BYOAI on TRIAL and on STARTER, and permits it from BUSINESS up", async () => {
    for (const plan of ["TRIAL", "STARTER"]) {
      onPlan(plan);
      expect((await refusal(() => configureByoai(async () => "ok"))).code).toBe(
        "PAYMENT_REQUIRED",
      );
    }

    for (const plan of ["BUSINESS", "PRO"]) {
      onPlan(plan);
      await expect(configureByoai(async () => "configured")).resolves.toBe(
        "configured",
      );
    }
  });

  it("permits publishing on every plan, trial included", async () => {
    for (const plan of ["TRIAL", "STARTER", "BUSINESS", "PRO"]) {
      onPlan(plan);
      await expect(publishCourse(async () => "published")).resolves.toBe(
        "published",
      );
    }
  });

  it("resolves the organization's subscription on every check, never a cached answer", async () => {
    await configureByoai(async () => "ok");
    await configureByoai(async () => "ok");

    expect(db.organizationSubscription.findUnique).toHaveBeenCalledTimes(2);
    expect(db.organizationSubscription.findUnique).toHaveBeenLastCalledWith({
      where: { organizationId: ORG },
      select: {
        plan: true,
        purchasedLearnerSeats: true,
        status: true,
        pastDueSince: true,
        currentPeriodStart: true,
      },
    });
  });

  it("never runs the operation it refused", async () => {
    onPlan("STARTER");
    const configure = vi.fn(async () => "never");

    await refusal(() => configureByoai(configure));

    expect(configure).not.toHaveBeenCalled();
  });
});

describe("FG2/FG5 — what the refusal says", () => {
  it("names BYOAI's own application code and the tier that sells it", async () => {
    onPlan("STARTER");

    const error = await refusal(() => configureByoai(async () => "never"));

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe("entitlement.byoai_requires_upgrade");
    expect(error.details).toEqual({
      reason: "not_in_plan",
      requiredPlan: "Business",
    });
    expect(error.message).toContain("Business");
  });

  it("lets a trial organization publish — a public course is unreachable until it is published", async () => {
    onPlan("TRIAL");

    await expect(publishCourse(async () => "published")).resolves.toBe(
      "published",
    );
  });
});

describe("FG3/FG4 — a lapsed subscription withdraws the feature, a late one does not", () => {
  it("refuses a canceled Business organization, naming the lapse rather than an upgrade", async () => {
    onPlan("BUSINESS", "CANCELED");

    const error = await refusal(() => configureByoai(async () => "never"));

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.details).toEqual({
      reason: "lapsed",
      requiredPlan: "Business",
    });
    expect(error.message).toMatch(/lapsed/i);
    expect(error.message).not.toMatch(/upgrade/i);
  });

  it("refuses publishing for a canceled organization", async () => {
    onPlan("STARTER", "CANCELED");

    const error = await refusal(() => publishCourse(async () => "never"));

    expect(error.applicationCode).toBe("entitlement.publish_requires_plan");
    expect(error.message).toMatch(/lapsed/i);
  });

  it("FG4: a past-due organization is still inside its grace period and keeps both features", async () => {
    onPlan("BUSINESS", "PAST_DUE");

    await expect(configureByoai(async () => "configured")).resolves.toBe(
      "configured",
    );
    await expect(publishCourse(async () => "published")).resolves.toBe(
      "published",
    );
  });
});

describe("FG6/FG7/FG8 — fail closed, no bypass, no currency", () => {
  it("FG6: an organization with no subscription is refused, not offered an upgrade", async () => {
    onPlan(null);

    const error = await refusal(() => publishCourse(async () => "never"));

    expect(error.applicationCode).toBe("entitlement.unresolvable");
  });

  it("FG7: the internal plan traverses the same read and is permitted by its catalogue row", async () => {
    onPlan("INTERNAL");

    await expect(configureByoai(async () => "configured")).resolves.toBe(
      "configured",
    );
    await expect(publishCourse(async () => "published")).resolves.toBe(
      "published",
    );
    expect(db.organizationSubscription.findUnique).toHaveBeenCalledTimes(2);
  });

  it("FG8: a permitted gate spends no generation, reads no balance and writes no ledger entry", async () => {
    await configureByoai(async () => "configured");

    expect(db.organizationCredit.findUnique).not.toHaveBeenCalled();
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });
});

describe("S2 — a chat/image turn on a downgraded endpoint stops being free", () => {
  const generateOnOwnEndpoint = async <T>(operation: () => Promise<T>) => {
    assertAllowed(await decideOwnEndpointGeneration(mockedDb, ORG));
    return operation();
  };

  it("refuses the same plans byoai.configure does, and permits the same ones", async () => {
    for (const plan of ["TRIAL", "STARTER"]) {
      onPlan(plan);
      expect(
        (await refusal(() => generateOnOwnEndpoint(async () => "generated")))
          .code,
      ).toBe("PAYMENT_REQUIRED");
    }

    for (const plan of ["BUSINESS", "PRO", "INTERNAL"]) {
      onPlan(plan);
      await expect(
        generateOnOwnEndpoint(async () => "generated"),
      ).resolves.toBe("generated");
    }
  });

  it("PL18: refuses a lapsed subscription in the lapse's own words, not the upgrade's", async () => {
    onPlan("BUSINESS", "CANCELED");

    const error = await refusal(() =>
      generateOnOwnEndpoint(async () => "never"),
    );

    expect(error.applicationCode).toBe(GENERATIONS_LAPSED);
  });

  it("tells a downgraded organization the thing it can act on, lapsed or not", async () => {
    onPlan("STARTER", "CANCELED");

    const error = await refusal(() =>
      generateOnOwnEndpoint(async () => "never"),
    );

    expect(error.applicationCode).toBe(
      "entitlement.byoai_generation_withdrawn",
    );
  });

  it("asks the subscription once, however many questions it has", async () => {
    onPlan("BUSINESS");

    await generateOnOwnEndpoint(async () => "generated");

    expect(db.organizationSubscription.findUnique).toHaveBeenCalledTimes(1);
  });

  it("names the withdrawal distinctly from the configuration refusal", async () => {
    onPlan("STARTER");

    const error = await refusal(() =>
      generateOnOwnEndpoint(async () => "never"),
    );

    expect(error.applicationCode).toBe(
      "entitlement.byoai_generation_withdrawn",
    );
    expect(error.message).toContain("Business");
  });

  it("never generates what it refused", async () => {
    onPlan("STARTER");
    const generate = vi.fn(async () => "never");

    await refusal(() => generateOnOwnEndpoint(generate));

    expect(generate).not.toHaveBeenCalled();
  });
});

describe("EG1/EG2 — enrollment is every plan's, until the subscription lapses", () => {
  const enroll = async <T>(operation: () => Promise<T>) => {
    assertAllowed(
      await decideEnrollment(mockedDb, ORG, { candidateUserIds: [] }),
    );
    return operation();
  };

  it("EG2: permits every plan, including the trial that has no seats to fill", async () => {
    for (const plan of ["TRIAL", "STARTER", "BUSINESS", "PRO", "INTERNAL"]) {
      onPlan(plan);
      await expect(enroll(async () => "enrolled")).resolves.toBe("enrolled");
    }
  });

  it("EG1: refuses a canceled organization, naming the lapse and no tier to buy", async () => {
    onPlan("STARTER", "CANCELED");

    const error = await refusal(() => enroll(async () => "never"));

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe(
      "entitlement.enroll_requires_subscription",
    );
    expect(error.message).toMatch(/lapsed/i);
    expect(error.message).not.toMatch(/upgrade/i);
    expect(error.message).toMatch(/already assigned keep running/i);
  });

  it("FG4: a past-due organization keeps enrolling", async () => {
    onPlan("STARTER", "PAST_DUE");

    await expect(enroll(async () => "enrolled")).resolves.toBe("enrolled");
  });

  it("EG2: leaves the trial's zero-seat refusal to the cap, which words it usefully", async () => {
    onPlan("TRIAL");
    noLearnersYet();

    const error = await refusal(async () => {
      assertAllowed(
        await decideEnrollment(mockedDb, ORG, {
          candidateUserIds: ["learner-1"],
        }),
      );
      return "enrolled";
    });

    expect(error.applicationCode).toBe("entitlement.seats_exhausted");
    expect(error.message).toMatch(/subscribe/i);
  });
});

describe("LS7 — a plan with no seats is told to subscribe, not to buy one more seat", () => {
  async function enrollOne() {
    assertAllowed(
      await decideEnrollment(mockedDb, ORG, {
        candidateUserIds: ["learner-1"],
      }),
    );
    return "enrolled";
  }

  beforeEach(() => {
    noLearnersYet();
  });

  it("refuses a trial organization's first learner and points at plans", async () => {
    onPlan("TRIAL");

    const error = await refusal(enrollOne);

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe("entitlement.seats_exhausted");
    expect(error.message).toMatch(/subscribe/i);
    expect(error.message).not.toMatch(/additional seat/i);
    expect(error.details).toEqual({ shortfall: 1, remainingSeats: 0 });
  });

  it("still tells a full paid plan exactly how many seats it is short", async () => {
    onPlan("STARTER");

    db.$queryRaw.mockResolvedValue([{ count: 50 }]);
    db.courseEnrollment.findMany.mockResolvedValue([]);

    const error = await refusal(enrollOne);

    expect(error.message).toContain("1 additional seat");
  });
});
