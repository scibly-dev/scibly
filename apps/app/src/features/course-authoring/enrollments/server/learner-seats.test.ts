import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Wiring rows live in enrollments.test.ts.
const db = vi.hoisted(() => ({
  organizationSubscription: { findUnique: vi.fn() },
  courseEnrollment: { findMany: vi.fn() },
  organizationCredit: { updateMany: vi.fn(), findUnique: vi.fn() },
  creditLedgerEntry: { create: vi.fn(), update: vi.fn() },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));

const { db: mockedDb } = await import("@scibly/db");
const { assertAllowed, decideEnrollment } =
  await import("@scibly/api/entitlement");

const ORG = "org-a";

async function checkSeats<T>(
  candidateUserIds: string[],
  operation: () => Promise<T>,
): Promise<T> {
  assertAllowed(await decideEnrollment(mockedDb, ORG, { candidateUserIds }));
  return operation();
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("expected the enrollment to be refused, but it resolved");
}

function onPlan(plan: string | null, purchasedLearnerSeats = 0) {
  db.organizationSubscription.findUnique.mockResolvedValue(
    plan === null ? null : { plan, purchasedLearnerSeats },
  );
}

function learners(...userIds: string[]) {
  db.$queryRaw.mockResolvedValue([{ count: userIds.length }]);
  db.courseEnrollment.findMany.mockImplementation(
    async ({ where }: { where: { userId: { in: string[] } } }) =>
      userIds
        .filter((userId) => where.userId.in.includes(userId))
        .map((userId) => ({ userId })),
  );
}

function learnerCount(n: number) {
  learners(...Array.from({ length: n }, (_, i) => `existing-${i}`));
}

beforeEach(() => {
  vi.resetAllMocks();

  onPlan("STARTER");
  learners();
});

describe("LS1/LS4 — the cap is included plus purchased seats, boundary inclusive", () => {
  it("LS4: newcomers exactly filling the included seats are permitted", async () => {
    learnerCount(47);

    const result = await checkSeats(["n1", "n2", "n3"], async () => "enrolled");

    expect(result).toBe("enrolled");
  });

  it("LS1: purchased seats extend the plan's included seats", async () => {
    onPlan("STARTER", 2);
    learnerCount(50);

    await expect(
      checkSeats(["n1", "n2"], async () => "enrolled"),
    ).resolves.toBe("enrolled");
  });

  it("LS1: one newcomer past the cap is blocked", async () => {
    learnerCount(50);

    const error = await refusal(() => checkSeats(["n1"], async () => "never"));

    expect(error.code).toBe("PAYMENT_REQUIRED");
  });
});

describe("LS3 — the block names exactly how many seats are short", () => {
  it("LS3: refuses with the exact shortfall and runs nothing", async () => {
    learnerCount(48);
    const operation = vi.fn(async () => "never");

    const error = await refusal(() =>
      checkSeats(["n1", "n2", "n3", "n4", "n5"], operation),
    );

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe("entitlement.seats_exhausted");
    expect(error.details).toEqual({ shortfall: 3, remainingSeats: 2 });
    expect(error.message).toContain("3");
    expect(operation).not.toHaveBeenCalled();
  });

  it("LS3: the refusal names seat exhaustion, so a surface can restate it in its own words", async () => {
    learnerCount(50);

    const error = await refusal(() => checkSeats(["n1"], async () => "never"));

    expect(error.applicationCode).toBe("entitlement.seats_exhausted");
  });
});

describe("LS2 — existing learners never consume a seat", () => {
  it("LS2: candidates already enrolled somewhere in the organization are free", async () => {
    learners(
      ...Array.from({ length: 48 }, (_, i) => `existing-${i}`),
      "u1",
      "u2",
    );

    await expect(
      checkSeats(["u1", "u2"], async () => "enrolled"),
    ).resolves.toBe("enrolled");
  });

  it("LS2: a full cap blocks only the genuinely new candidate", async () => {
    learners(...Array.from({ length: 49 }, (_, i) => `existing-${i}`), "u1");

    const error = await refusal(() =>
      checkSeats(["u1", "n1"], async () => "never"),
    );

    expect(error.details).toEqual({ shortfall: 1, remainingSeats: 0 });
  });

  it("LC2: a candidate repeated in the request counts once", async () => {
    learnerCount(49);

    await expect(
      checkSeats(["n1", "n1"], async () => "enrolled"),
    ).resolves.toBe("enrolled");
  });
});

describe("PC10 — a plan landed under the learners already enrolled", () => {
  const overCap = () =>
    learners(...Array.from({ length: 179 }, (_, i) => `existing-${i}`), "u1");

  it("PC10: a learner already enrolled keeps their access", async () => {
    overCap();

    await expect(checkSeats(["u1"], async () => "enrolled")).resolves.toBe(
      "enrolled",
    );
  });

  it("PC10: only the newcomer is refused, named against the seats actually short", async () => {
    overCap();

    const error = await refusal(() =>
      checkSeats(["u1", "n1"], async () => "never"),
    );

    expect(error.details).toEqual({ shortfall: 1, remainingSeats: 0 });
  });
});

describe("LC1/LC4/LC5/LC6 — what the count reads", () => {
  const countQuery = (): { text: string; values: unknown[] } => {
    const [[sql]] = db.$queryRaw.mock.calls;
    return sql;
  };

  it("LC1/LC5: a distinct count in the database over the denormalised column — no role, no member table, no course join", async () => {
    await checkSeats(["n1"], async () => "ok");

    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    const sql = countQuery();
    expect(sql.text).toContain('COUNT(DISTINCT "userId")');
    expect(sql.text).toContain('FROM "course_enrollment"');
    expect(sql.text).not.toContain("JOIN");
    expect(sql.values).toEqual([ORG]);
  });

  it("LC4: the count passes over nulled user references, so removed learners cost nothing", async () => {
    await checkSeats(["n1"], async () => "ok");

    expect(countQuery().text).toContain('"userId" IS NOT NULL');
  });

  it("LC6: the newcomer discount asks only about the candidates it was handed", async () => {
    await checkSeats(["n1", "n2"], async () => "ok");

    expect(db.courseEnrollment.findMany).toHaveBeenCalledTimes(1);
    expect(db.courseEnrollment.findMany).toHaveBeenCalledWith({
      where: { organizationId: ORG, userId: { in: ["n1", "n2"] } },
      distinct: ["userId"],
      select: { userId: true },
    });
  });
});

describe("LS5/LS6 — fail closed, no bypass", () => {
  it("LS5: a missing subscription refuses the enrollment, never softened into a buy-seats message", async () => {
    onPlan(null);
    const operation = vi.fn(async () => "never");

    const error = await refusal(() => checkSeats(["n1"], operation));

    expect(error.applicationCode).toBe("entitlement.unresolvable");
    expect(operation).not.toHaveBeenCalled();
  });

  it("LS6: the internal plan traverses the same resolution and count, and its cap is simply unreachable", async () => {
    onPlan("INTERNAL");
    learnerCount(100_000);

    await expect(
      checkSeats(
        Array.from({ length: 500 }, (_, i) => `n${i}`),
        async () => "enrolled",
      ),
    ).resolves.toBe("enrolled");
    expect(db.organizationSubscription.findUnique).toHaveBeenCalledTimes(1);
    expect(db.courseEnrollment.findMany).toHaveBeenCalledTimes(1);
  });

  it("N5: a permitted seat check spends nothing and records nothing", async () => {
    learnerCount(0);

    await checkSeats(["n1"], async () => "ok");

    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("TRIAL: zero included seats block the first learner — matching the plan table", async () => {
    onPlan("TRIAL");
    learnerCount(0);

    const error = await refusal(() => checkSeats(["n1"], async () => "never"));

    expect(error.details).toEqual({ shortfall: 1, remainingSeats: 0 });
  });
});
