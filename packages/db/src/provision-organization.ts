import { type Prisma, type PrismaClient } from "./client";
import { CORE_PLANS } from "./plan-catalogue";

// The only plans core code provisions directly, without going through ee/billing — a paid plan is granted via ee/billing's Stripe subscription sync instead.
type CorePlan = "TRIAL" | "INTERNAL";

const subscriptionRow = (
  organizationId: string,
  plan: CorePlan,
  now: Date,
) => ({
  organizationId,
  plan,
  status: "ACTIVE" as const,
  currentPeriodStart: now,
});

const creditRow = (organizationId: string, plan: CorePlan, now: Date) => ({
  organizationId,
  allowanceRemaining: CORE_PLANS[plan].generations.amount,
  topupRemaining: 0,
  periodStart: now,
});

// Grants an organization the given plan and its generation allowance in a single transaction, so it's never half-provisioned; throws if either row already exists.
export async function provisionOrganizationPlan(
  db: PrismaClient,
  organizationId: string,
  plan: CorePlan,
): Promise<void> {
  const now = new Date();
  await db.$transaction([
    db.organizationSubscription.create({
      data: subscriptionRow(organizationId, plan, now),
    }),
    db.organizationCredit.create({
      data: creditRow(organizationId, plan, now),
    }),
  ]);
}

// Backfill variant for seeding: creates whichever of the two rows is missing, never overwrites an existing one.
export async function ensureOrganizationPlan(
  db: PrismaClient,
  organizationId: string,
  plan: CorePlan,
): Promise<{ seededSubscription: boolean; seededCredit: boolean }> {
  const [subscription, credit] = await Promise.all([
    db.organizationSubscription.findUnique({
      where: { organizationId },
      select: { id: true },
    }),
    db.organizationCredit.findUnique({
      where: { organizationId },
      select: { id: true },
    }),
  ]);

  const seededSubscription = !subscription;
  const seededCredit = !credit;
  const now = new Date();

  const creates: Prisma.PrismaPromise<unknown>[] = [];
  if (seededSubscription) {
    creates.push(
      db.organizationSubscription.create({
        data: subscriptionRow(organizationId, plan, now),
      }),
    );
  }
  if (seededCredit) {
    creates.push(
      db.organizationCredit.create({
        data: creditRow(organizationId, plan, now),
      }),
    );
  }
  if (creates.length > 0) await db.$transaction(creates);

  return { seededSubscription, seededCredit };
}
