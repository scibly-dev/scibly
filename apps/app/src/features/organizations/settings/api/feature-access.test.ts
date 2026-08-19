import { createCallerFactory } from "@scibly/api/trpc";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A real tRPC caller over the real router and gates; only membership and the db row are doubled.
const db = vi.hoisted(() => ({
  organizationSubscription: { findUnique: vi.fn() },
}));

const policy = vi.hoisted(() => ({
  requireOrganizationBySlug: vi.fn(),
  requireOrgMember: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("../../server/policy", () => policy);

const { db: prisma } = await import("@scibly/db");
const { billingRouter } = await import("./billing.router");
const {
  assertAllowed,
  decideByoaiConfiguration,
  decideCoursePublishing,
  decideEnrollment,
} = await import("@scibly/api/entitlement");

const createCaller = createCallerFactory(billingRouter);

const ORG_ID = "org-1";
const ORG_SLUG = "org-1-slug";
const USER_ID = "user-1";

function caller() {
  const now = new Date("2026-01-01T00:00:00Z");
  return createCaller({
    db: prisma,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    actor: { userId: USER_ID },
    session: {
      session: {
        id: "sess-1",
        createdAt: now,
        updatedAt: now,
        userId: USER_ID,
        expiresAt: new Date("2026-12-31T00:00:00Z"),
        token: "token",
      },
      user: {
        id: USER_ID,
        name: "Owner",
        email: "owner@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
}

function onPlan(plan: string, status = "ACTIVE", purchasedLearnerSeats = 0) {
  db.organizationSubscription.findUnique.mockResolvedValue({
    plan,
    status,
    purchasedLearnerSeats,
  });
}

const access = () => caller().getFeatureAccess({ orgSlug: ORG_SLUG });

beforeEach(() => {
  vi.clearAllMocks();
  onPlan("STARTER");
  policy.requireOrganizationBySlug.mockResolvedValue({ id: ORG_ID });
  policy.requireOrgMember.mockResolvedValue({ id: "mem-1", role: "member" });
});

describe("the reader and the enforcement answer alike", () => {
  it("permits nothing the BYOAI gate would refuse", async () => {
    for (const plan of ["TRIAL", "STARTER", "BUSINESS", "PRO"]) {
      onPlan(plan);
      const described = (await access()).byoai.allowed;
      const enforced = await decideByoaiConfiguration(prisma, ORG_ID)
        .then((decision) => {
          assertAllowed(decision);
          return true;
        })
        .catch(() => false);

      expect({ plan, described }).toEqual({ plan, described: enforced });
    }
  });

  it("permits nothing the publish gate would refuse", async () => {
    for (const status of ["ACTIVE", "PAST_DUE", "CANCELED"]) {
      onPlan("BUSINESS", status);
      const described = (await access()).publish.allowed;
      const enforced = await decideCoursePublishing(prisma, ORG_ID)
        .then((decision) => {
          assertAllowed(decision);
          return true;
        })
        .catch(() => false);

      expect({ status, described }).toEqual({ status, described: enforced });
    }
  });

  it("permits no enrollment the subscription gate would refuse", async () => {
    for (const status of ["ACTIVE", "PAST_DUE", "CANCELED"]) {
      onPlan("BUSINESS", status);
      const described = (await access()).enroll.allowed;
      const enforced = await decideEnrollment(prisma, ORG_ID, {
        candidateUserIds: [],
      })
        .then((decision) => {
          assertAllowed(decision);
          return true;
        })
        .catch(() => false);

      expect({ status, described }).toEqual({ status, described: enforced });
    }
  });
});

describe("a refusal says which kind it is", () => {
  it("reports no reason for a plan that includes the feature", async () => {
    onPlan("BUSINESS");

    expect((await access()).byoai).toMatchObject({
      allowed: true,
      reason: null,
    });
  });

  it("separates a plan that never included it from one that lapsed", async () => {
    onPlan("STARTER");
    const neverIncluded = (await access()).byoai.reason;
    onPlan("BUSINESS", "CANCELED");
    const withdrawn = (await access()).byoai.reason;

    expect([neverIncluded, withdrawn]).toEqual(["not_in_plan", "lapsed"]);
  });

  it("keeps a grace period permitted", async () => {
    onPlan("BUSINESS", "PAST_DUE");

    expect((await access()).byoai.allowed).toBe(true);
  });
});

describe("the tier comes from the catalogue", () => {
  it("names the cheapest billed plan including BYOAI", async () => {
    onPlan("STARTER");

    expect((await access()).byoai.requiredPlan).toBe("Business");
  });

  it("names the cheapest billed plan including publishing", async () => {
    onPlan("TRIAL");

    expect((await access()).publish.requiredPlan).toBe("Starter");
  });

  it("names a tier even when the organization already has the feature", async () => {
    onPlan("PRO");

    expect((await access()).byoai).toMatchObject({
      allowed: true,
      requiredPlan: "Business",
    });
  });
});

describe("the lapse answers first, then the seats", () => {
  it("refuses an organization whose plan includes no seat", async () => {
    onPlan("TRIAL");

    expect((await access()).enroll).toMatchObject({
      allowed: false,
      reason: "not_in_plan",
      requiredPlan: "Starter",
    });
  });

  it("permits a trial organization that bought seats", async () => {
    onPlan("TRIAL", "ACTIVE", 5);

    expect((await access()).enroll.allowed).toBe(true);
  });

  it("refuses a lapsed organization even though it has seats", async () => {
    onPlan("BUSINESS", "CANCELED");

    expect((await access()).enroll).toMatchObject({
      allowed: false,
      reason: "lapsed",
    });
  });

  it("keeps a past-due organization enrolling", async () => {
    onPlan("BUSINESS", "PAST_DUE");

    expect((await access()).enroll.allowed).toBe(true);
  });

  it("reports the lapse rather than the seat count, so the copy can differ", async () => {
    onPlan("TRIAL", "CANCELED");

    expect((await access()).enroll.reason).toBe("lapsed");
  });
});

describe("membership is what the question needs", () => {
  it("answers a plain member", async () => {
    policy.requireOrgMember.mockResolvedValue({ id: "mem-1", role: "member" });

    await expect(access()).resolves.toBeDefined();
  });

  it("asks the membership of the organization the slug named", async () => {
    await access();

    expect(policy.requireOrgMember).toHaveBeenCalledWith(ORG_ID, USER_ID);
  });

  it("refuses whoever the membership check refuses", async () => {
    policy.requireOrgMember.mockRejectedValue(new Error("not a member"));

    await expect(access()).rejects.toThrow();
  });
});

describe("three features, one round trip", () => {
  it("answers all three", async () => {
    expect(Object.keys(await access()).sort()).toEqual([
      "byoai",
      "enroll",
      "publish",
    ]);
  });

  it("fails closed when the subscription cannot be resolved", async () => {
    db.organizationSubscription.findUnique.mockResolvedValue(null);

    await expect(access()).rejects.toThrow();
  });
});
