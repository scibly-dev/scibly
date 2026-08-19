import { SPEND_ACTIONS } from "@scibly/db/topup-catalogue";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The read is the whole subject — the cards that render it are wiring.
const policy = vi.hoisted(() => ({
  requireOrganizationBySlug: vi.fn(),
  requireOrgMember: vi.fn(),
}));

const db = vi.hoisted(() => ({
  organizationSubscription: { findUnique: vi.fn() },
  organizationCredit: { findUnique: vi.fn(), updateMany: vi.fn() },
  creditLedgerEntry: { groupBy: vi.fn(), create: vi.fn(), update: vi.fn() },
  courseEnrollment: { findMany: vi.fn() },
  user: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server/policy", () => policy);

const { readBillingUsageOverview } =
  await import("./usage-overview.operations");

const ORG_SLUG = "acme";
const ORG_ID = "org-1";
const OWNER = "user-owner";

const PERIOD_START = new Date("2026-07-01T00:00:00.000Z");
const PERIOD_END = new Date("2026-08-01T00:00:00.000Z");

function onPlan(plan: string | null, purchasedLearnerSeats = 0) {
  db.organizationSubscription.findUnique.mockResolvedValue(
    plan === null ? null : { plan, purchasedLearnerSeats },
  );
}

function credit(row: { allowance: number; topup?: number } | null) {
  db.organizationCredit.findUnique.mockResolvedValue(
    row === null
      ? null
      : {
          allowanceRemaining: row.allowance,
          topupRemaining: row.topup ?? 0,
          periodStart: PERIOD_START,
          periodEnd: PERIOD_END,
        },
  );
}

function ledger(
  authors: { actorId: string | null; credits: number }[],
  actions: { action: string; credits: number }[],
  buckets: { bucket: string; credits: number }[] = [],
) {
  db.creditLedgerEntry.groupBy
    .mockReset()
    .mockResolvedValueOnce(
      authors.map((row) => ({
        actorId: row.actorId,
        _sum: { creditsCharged: row.credits },
      })),
    )
    .mockResolvedValueOnce(
      actions.map((row) => ({
        action: row.action,
        _sum: { creditsCharged: row.credits },
      })),
    )
    .mockResolvedValueOnce(
      buckets.map((row) => ({
        bucket: row.bucket,
        _sum: { creditsCharged: row.credits },
      })),
    );
}

function named(...users: { id: string; name?: string; email: string }[]) {
  db.user.findMany.mockResolvedValue(
    users.map((user) => ({ name: null, ...user })),
  );
}

function learners(...userIds: string[]) {
  db.$queryRaw.mockResolvedValue([{ count: userIds.length }]);
}

const read = () => readBillingUsageOverview(ORG_SLUG, OWNER);

beforeEach(() => {
  vi.clearAllMocks();
  db.creditLedgerEntry.groupBy.mockReset();
  policy.requireOrganizationBySlug.mockResolvedValue({ id: ORG_ID });
  policy.requireOrgMember.mockResolvedValue({ role: "admin" });

  onPlan("STARTER");
  credit({ allowance: 1_000 });
  ledger([], []);
  named();
  learners();
});

describe("BG1/BG2/BG8 — one total, and what it is made of", () => {
  it("reports used as the allowance minus what is left", async () => {
    credit({ allowance: 260 });

    const overview = await read();

    expect(overview?.generations).toMatchObject({
      allowance: 1_000,
      used: 740,
      allowanceRemaining: 260,
    });
  });

  it("counts the top-up balance into the total and what is left", async () => {
    credit({ allowance: 200, topup: 350 });

    const overview = await read();

    expect(overview?.generations).toMatchObject({
      total: 1_350,
      totalUsed: 800,
      remaining: 550,
    });
  });

  it("keeps the plan's own numbers reportable beside the total", async () => {
    credit({ allowance: 200, topup: 350 });

    const overview = await read();

    expect(overview?.generations).toMatchObject({
      allowance: 1_000,
      used: 800,
      allowanceRemaining: 200,
      topupRemaining: 350,
    });
  });

  it("BG8: counts the top-up spent this period as both held and used", async () => {
    credit({ allowance: 0, topup: 150 });
    ledger(
      [],
      [],
      [
        { bucket: "ALLOWANCE", credits: 1_000 },
        { bucket: "TOPUP", credits: 100 },
      ],
    );

    const overview = await read();

    expect(overview?.generations).toMatchObject({
      topupUsed: 100,

      total: 1_250,
      totalUsed: 1_100,
      remaining: 150,
    });
  });

  it("BG8: the total and the used figure close on the remainder", async () => {
    credit({ allowance: 120, topup: 40 });
    ledger([], [], [{ bucket: "TOPUP", credits: 60 }]);

    const overview = await read();
    const { total, totalUsed, remaining } = overview!.generations;

    expect(total - totalUsed).toBe(remaining);
  });

  it("BG8: allowance spend is not counted as top-up spend", async () => {
    ledger([], [], [{ bucket: "ALLOWANCE", credits: 400 }]);

    const overview = await read();

    expect(overview?.generations.topupUsed).toBe(0);
  });

  it("BG8: an organization that never bought one holds only its allowance", async () => {
    credit({ allowance: 400 });

    const overview = await read();

    expect(overview?.generations).toMatchObject({
      total: 1_000,
      totalUsed: 600,
      remaining: 400,
      topupUsed: 0,
    });
  });
});

describe("BG3/BG4 — when the allowance comes back", () => {
  it("names the credit row's period end", async () => {
    const overview = await read();

    expect(overview?.generations.resetsAt).toEqual(PERIOD_END);
  });

  it("names no date for a grant that does not renew", async () => {
    onPlan("TRIAL");
    credit({ allowance: 40 });

    const overview = await read();

    expect(overview?.generations.resetsAt).toBeNull();
    expect(overview?.generations.used).toBe(60);
  });
});

describe("BG5 — unknown rather than empty", () => {
  it("reports nothing at all when the credit row is missing", async () => {
    credit(null);

    await expect(read()).resolves.toBeNull();
  });

  it("reports nothing at all when no plan resolves", async () => {
    onPlan(null);

    await expect(read()).resolves.toBeNull();
  });

  it("reads no ledger for an organization it cannot report on", async () => {
    credit(null);

    await read();

    expect(db.creditLedgerEntry.groupBy).not.toHaveBeenCalled();
  });
});

describe("BG6/BG7 — numbers nobody should have to read", () => {
  it("marks an effectively unlimited grant as unlimited", async () => {
    onPlan("INTERNAL");
    credit({ allowance: 1_000_000_000 });

    const overview = await read();

    expect(overview?.generations.unlimited).toBe(true);
  });

  it("leaves an ordinary plan's grant a number", async () => {
    const overview = await read();

    expect(overview?.generations.unlimited).toBe(false);
  });

  it("clamps usage at zero when a refund credits past the top", async () => {
    credit({ allowance: 1_200 });

    const overview = await read();

    expect(overview?.generations.used).toBe(0);
  });
});

describe("BL1/BL2 — this period, and only the charges that stuck", () => {
  it("counts from the period the credit row is in, and excludes refunds", async () => {
    await read();

    for (const call of db.creditLedgerEntry.groupBy.mock.calls) {
      expect(call[0].where).toEqual({
        organizationId: ORG_ID,
        refundedAt: null,
        action: { in: [...SPEND_ACTIONS] },
        createdAt: { gte: PERIOD_START },
      });
    }
  });
});

describe("BL3/BL4 — two views of one period", () => {
  it("ranks authors largest spender first", async () => {
    ledger(
      [
        { actorId: "u-small", credits: 12 },
        { actorId: "u-large", credits: 300 },
        { actorId: "u-middle", credits: 90 },
      ],
      [],
    );
    named(
      { id: "u-small", name: "Small", email: "s@acme.test" },
      { id: "u-large", name: "Large", email: "l@acme.test" },
      { id: "u-middle", name: "Middle", email: "m@acme.test" },
    );

    const overview = await read();

    expect(overview?.spend.byAuthor.map((row) => row.name)).toEqual([
      "Large",
      "Middle",
      "Small",
    ]);
  });

  it("names an author by their email when they never set a name", async () => {
    ledger([{ actorId: "u-1", credits: 5 }], []);
    named({ id: "u-1", email: "nameless@acme.test" });

    const overview = await read();

    expect(overview?.spend.byAuthor[0]?.name).toBe("nameless@acme.test");
  });

  it("ranks actions largest first", async () => {
    ledger(
      [],
      [
        { action: "IMAGE_GENERATION", credits: 20 },
        { action: "CHAT_MESSAGE", credits: 220 },
      ],
    );

    const overview = await read();

    expect(overview?.spend.byAction.map((row) => row.action)).toEqual([
      "CHAT_MESSAGE",
      "IMAGE_GENERATION",
    ]);
  });

  it("totals the same number the actions add up to", async () => {
    ledger(
      [
        { actorId: "u-1", credits: 200 },
        { actorId: "u-2", credits: 40 },
      ],
      [
        { action: "CHAT_MESSAGE", credits: 220 },
        { action: "SOURCE_INGEST", credits: 20 },
      ],
    );
    named(
      { id: "u-1", email: "a@acme.test" },
      { id: "u-2", email: "b@acme.test" },
    );

    const overview = await read();

    const byAction = overview!.spend.byAction.reduce(
      (sum, row) => sum + row.credits,
      0,
    );
    expect(overview?.spend.total).toBe(240);
    expect(byAction).toBe(240);
  });
});

describe("BL5 — a deleted author keeps their credits", () => {
  it("keeps the row and loses only the name", async () => {
    ledger(
      [
        { actorId: null, credits: 70 },
        { actorId: "u-1", credits: 30 },
      ],
      [],
    );
    named({ id: "u-1", email: "a@acme.test" });

    const overview = await read();

    expect(overview?.spend.byAuthor[0]).toEqual({
      actorId: null,
      name: null,
      credits: 70,
    });
  });

  it("counts those credits in the total", async () => {
    ledger([{ actorId: null, credits: 70 }], []);

    const overview = await read();

    expect(overview?.spend.total).toBe(70);
  });

  it("asks for no user record for an author who no longer exists", async () => {
    ledger([{ actorId: null, credits: 70 }], []);

    await read();

    expect(db.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: [] } },
      select: { id: true, name: true, email: true },
    });
  });
});

describe("BL6 — the ledger can total more than the allowance used", () => {
  it("reports both numbers rather than reconciling them", async () => {
    credit({ allowance: 100, topup: 300 });
    ledger([{ actorId: "u-1", credits: 1_100 }], []);
    named({ id: "u-1", email: "a@acme.test" });

    const overview = await read();

    expect(overview?.generations.used).toBe(900);
    expect(overview?.spend.total).toBe(1_100);
  });
});

describe("BL7 — a long author list says what it left out", () => {
  const manyAuthors = Array.from({ length: 13 }, (_, index) => ({
    actorId: `u-${index}`,
    credits: 100 - index,
  }));

  it("lists ten authors and collects the rest into one row", async () => {
    ledger(manyAuthors, []);
    named(
      ...manyAuthors.map((row) => ({
        id: row.actorId,
        email: `${row.actorId}@acme.test`,
      })),
    );

    const overview = await read();

    expect(overview?.spend.byAuthor).toHaveLength(10);
    expect(overview?.spend.otherAuthors).toEqual({
      authors: 3,

      credits: 267,
    });
  });

  it("keeps the truncated authors in the total", async () => {
    ledger(manyAuthors, []);
    named(
      ...manyAuthors.map((row) => ({
        id: row.actorId,
        email: `${row.actorId}@acme.test`,
      })),
    );

    const overview = await read();

    expect(overview?.spend.total).toBe(
      manyAuthors.reduce((sum, row) => sum + row.credits, 0),
    );
  });

  it("collects nothing when every author fits", async () => {
    ledger([{ actorId: "u-1", credits: 5 }], []);
    named({ id: "u-1", email: "a@acme.test" });

    const overview = await read();

    expect(overview?.spend.otherAuthors).toBeNull();
  });
});

describe("BL8/BL9 — an unspent period, and a ledger nobody writes to", () => {
  it("reports empty breakdowns and a zero total", async () => {
    const overview = await read();

    expect(overview?.spend).toEqual({
      total: 0,
      byAuthor: [],
      otherAuthors: null,
      byAction: [],
    });
  });

  it("writes no ledger entry and debits no bucket", async () => {
    await read();

    expect(db.creditLedgerEntry.create).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.update).not.toHaveBeenCalled();
    expect(db.organizationCredit.updateMany).not.toHaveBeenCalled();
  });
});

describe("BS1–BS4 — seats, counted the way the cap counts them", () => {
  it("counts distinct enrolled learners against included plus purchased seats", async () => {
    onPlan("STARTER", 15);
    learners("l-1", "l-2", "l-3");

    const overview = await read();

    expect(overview?.seats).toEqual({
      used: 3,
      capacity: 65,
      included: 50,
      purchased: 15,
    });
  });

  it("counts only enrollments that still have a user", async () => {
    await read();

    const [[sql]] = db.$queryRaw.mock.calls;
    expect(sql.text).toContain('"userId" IS NOT NULL');
  });

  it("shows zero of zero for a plan that includes no seats", async () => {
    onPlan("TRIAL");
    credit({ allowance: 100 });

    const overview = await read();

    expect(overview?.seats).toEqual({
      used: 0,
      capacity: 0,
      included: 0,
      purchased: 0,
    });
  });

  it("enrolls nobody by asking", async () => {
    await read();

    expect(db.courseEnrollment.findMany).not.toHaveBeenCalled();
    const [[sql]] = db.$queryRaw.mock.calls;
    expect(sql.text).toContain('COUNT(DISTINCT "userId")');
    expect(sql.values).toEqual([ORG_ID]);
  });
});

describe("BP2 — the page is the owner's", () => {
  it("resolves the organization from the slug rather than trusting it", async () => {
    await read();

    expect(policy.requireOrganizationBySlug).toHaveBeenCalledWith(ORG_SLUG);
  });

  it("demands more than mere membership", async () => {
    await read();

    expect(policy.requireOrgMember).toHaveBeenCalledWith(
      ORG_ID,
      OWNER,
      "owner",
    );
  });

  it("reads nothing for a caller the guard turns away", async () => {
    policy.requireOrgMember.mockRejectedValue(
      Object.assign(new Error("Access denied."), { code: "FORBIDDEN" }),
    );

    await expect(read()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.organizationCredit.findUnique).not.toHaveBeenCalled();
    expect(db.creditLedgerEntry.groupBy).not.toHaveBeenCalled();
  });
});

describe("BP6 — one snapshot, one period boundary", () => {
  it("reads the credit row once and dates every count from it", async () => {
    await read();

    expect(db.organizationCredit.findUnique).toHaveBeenCalledTimes(1);
    expect(db.creditLedgerEntry.groupBy).toHaveBeenCalledTimes(3);
    const boundaries = db.creditLedgerEntry.groupBy.mock.calls.map(
      (call) => call[0].where.createdAt,
    );
    expect(new Set(boundaries.map((value) => String(value.gte))).size).toBe(1);
  });
});
