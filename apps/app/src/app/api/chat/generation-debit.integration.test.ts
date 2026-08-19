import { AppError } from "@scibly/api/application-error";
import { chargeAiGeneration } from "@scibly/api/entitlement";
import { createTestPrismaClient } from "@scibly/db/test-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Proves two requests racing one credit actually serialize in Postgres, which no mocked
// client can witness; opt in by setting this to a disposable database (setup: docs/integration-tests.md).
const url = process.env.ENTITLEMENT_INT_TEST_DATABASE_URL ?? "";

const RUN_ID = `int-entitlement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ORG = `${RUN_ID}-org`;
const ACTOR = `${RUN_ID}-actor`;

describe.runIf(url !== "")(
  "IT1 — two concurrent debits at a balance of one",
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
            create: { plan: "STARTER", currentPeriodStart: new Date() },
          },
          credit: {
            create: {
              allowanceRemaining: 1,
              topupRemaining: 0,
              periodStart: new Date(),
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

    it("IT1: exactly one succeeds, one is refused, and the balance ends at zero", async () => {
      const attempt = () =>
        chargeAiGeneration(
          {
            db,
            organizationId: ORG,
            actorId: ACTOR,
            action: "CHAT_MESSAGE",
          },
          async () => "charged",
        );

      const outcomes = await Promise.allSettled([attempt(), attempt()]);

      const fulfilled = outcomes.filter(
        (outcome) => outcome.status === "fulfilled",
      );
      const rejected = outcomes.filter(
        (outcome): outcome is PromiseRejectedResult =>
          outcome.status === "rejected",
      );
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      const reason: unknown = rejected[0]?.reason;
      expect(reason).toBeInstanceOf(AppError);
      if (reason instanceof AppError) {
        expect(reason.code).toBe("PAYMENT_REQUIRED");
      }

      const credit = await db.organizationCredit.findUniqueOrThrow({
        where: { organizationId: ORG },
      });
      expect(credit.allowanceRemaining).toBe(0);
      expect(credit.topupRemaining).toBe(0);

      const entries = await db.creditLedgerEntry.findMany({
        where: { organizationId: ORG },
      });
      expect(entries).toHaveLength(1);
      expect(entries[0]?.refundedAt).toBeNull();
      expect(entries[0]?.creditsCharged).toBe(1);
    });
  },
);
