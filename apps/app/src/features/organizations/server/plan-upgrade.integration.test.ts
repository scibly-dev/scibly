import { chargeAiGeneration } from "@scibly/api/entitlement";
import { createTestPrismaClient } from "@scibly/db/test-client";
import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";
import { syncSubscription } from "@scibly/ee-billing/sync-subscription";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Runs against a real Postgres increment, unlike PC2/PC3's mocked client — no mock can prove a charge survives a concurrent upgrade webhook. Opt in via ENTITLEMENT_INT_TEST_DATABASE_URL (docs/integration-tests.md).
const url = process.env.ENTITLEMENT_INT_TEST_DATABASE_URL ?? "";

const RUN_ID = `int-upgrade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ORG = `${RUN_ID}-org`;
const ACTOR = `${RUN_ID}-actor`;

const PERIOD_START = new Date("2026-02-01T00:00:00Z");
const STARTING_ALLOWANCE = 3;

describe.runIf(url !== "")(
  "IT2 — an upgrade landing while a generation is being charged",
  () => {
    const db = createTestPrismaClient(url);

    beforeAll(async () => {
      await db.user.create({
        data: {
          id: ACTOR,
          name: "Integration Actor",
          email: `${ACTOR}@int-test.local`,
        },
      });
      await db.organization.create({
        data: {
          id: ORG,
          name: "Integration Org",
          slug: ORG,
          createdAt: new Date(),
          subscription: {
            create: { plan: "STARTER", currentPeriodStart: PERIOD_START },
          },
          credit: {
            create: {
              allowanceRemaining: STARTING_ALLOWANCE,
              topupRemaining: 0,
              periodStart: PERIOD_START,
            },
          },
        },
      });
    });

    afterAll(async () => {
      await db.organization.delete({ where: { id: ORG } });
      await db.user.delete({ where: { id: ACTOR } });
      await db.$disconnect();
    });

    it("IT2: the charge and the grant both land — nothing spent is handed back", async () => {
      const upgrade = syncSubscription(db, {
        referenceId: ORG,
        plan: "pro",
        status: "active",
        periodStart: PERIOD_START,
        periodEnd: null,
        stripeCustomerId: "cus_int",
        stripeSubscriptionId: "sub_int",
      });
      const charge = chargeAiGeneration(
        { db, organizationId: ORG, actorId: ACTOR, action: "CHAT_MESSAGE" },
        async () => "charged",
      );

      await Promise.all([upgrade, charge]);

      const difference =
        PLAN_CATALOGUE.PRO.generations.amount -
        PLAN_CATALOGUE.STARTER.generations.amount;
      const credit = await db.organizationCredit.findUniqueOrThrow({
        where: { organizationId: ORG },
      });
      expect(credit.allowanceRemaining).toBe(
        STARTING_ALLOWANCE - 1 + difference,
      );
      expect(credit.topupRemaining).toBe(0);

      const subscription = await db.organizationSubscription.findUniqueOrThrow({
        where: { organizationId: ORG },
      });
      expect(subscription.plan).toBe("PRO");
    });
  },
);
