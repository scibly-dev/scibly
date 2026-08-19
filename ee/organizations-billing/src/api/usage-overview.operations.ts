import {
  type LearnerSeatUsage,
  readLearnerSeatUsage,
  spendableCredits,
} from "@scibly/api/entitlement";
import { db } from "@scibly/db";
import { EFFECTIVELY_UNLIMITED } from "@scibly/db/plan-catalogue";
import {
  isSpendAction,
  SPEND_ACTIONS,
  type SpendAction,
} from "@scibly/db/topup-catalogue";
import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";

import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "@/features/organizations/server/policy";

const AUTHOR_ROWS = 10;

type AuthorSpend = {
  actorId: string | null;
  name: string | null;
  credits: number;
};

export type BillingUsageOverview = {
  generations: {
    allowance: number;
    used: number;
    allowanceRemaining: number;
    topupRemaining: number;

    topupUsed: number;

    total: number;

    totalUsed: number;

    remaining: number;

    resetsAt: Date | null;

    unlimited: boolean;
  };
  spend: {
    total: number;
    byAuthor: AuthorSpend[];
    otherAuthors: { authors: number; credits: number } | null;
    byAction: { action: SpendAction; credits: number }[];
  };
  seats: LearnerSeatUsage | null;
};

export async function readBillingUsageOverview(
  orgSlug: string,
  userId: string,
): Promise<BillingUsageOverview | null> {
  const { id: organizationId } = await requireOrganizationBySlug(orgSlug);
  await requireOrgMember(organizationId, userId, "owner");

  const [subscription, credit] = await Promise.all([
    db.organizationSubscription.findUnique({
      where: { organizationId },
      select: { plan: true },
    }),
    db.organizationCredit.findUnique({
      where: { organizationId },
      select: {
        allowanceRemaining: true,
        topupRemaining: true,
        periodStart: true,
        periodEnd: true,
      },
    }),
  ]);

  const plan = subscription ? PLAN_CATALOGUE[subscription.plan] : undefined;
  if (!plan || !credit) return null;

  const spent = {
    organizationId,
    refundedAt: null,
    action: { in: [...SPEND_ACTIONS] },
    createdAt: { gte: credit.periodStart },
  };

  const [authorTotals, actionTotals, bucketTotals, seats] = await Promise.all([
    db.creditLedgerEntry.groupBy({
      by: ["actorId"],
      where: spent,
      _sum: { creditsCharged: true },
    }),
    db.creditLedgerEntry.groupBy({
      by: ["action"],
      where: spent,
      _sum: { creditsCharged: true },
    }),

    db.creditLedgerEntry.groupBy({
      by: ["bucket"],
      where: spent,
      _sum: { creditsCharged: true },
    }),
    readLearnerSeatUsage(db, organizationId),
  ]);

  const allowance = plan.generations.amount;

  const used = Math.max(0, allowance - credit.allowanceRemaining);
  const topupUsed = bucketTotals
    .filter((row) => row.bucket === "TOPUP")
    .reduce((sum, row) => sum + creditsOf(row), 0);

  return {
    generations: {
      allowance,
      used,
      allowanceRemaining: credit.allowanceRemaining,
      topupRemaining: credit.topupRemaining,
      topupUsed,

      total: allowance + topupUsed + credit.topupRemaining,
      totalUsed: used + topupUsed,
      remaining: spendableCredits(credit),
      resetsAt: plan.generations.renews ? credit.periodEnd : null,
      unlimited: allowance >= EFFECTIVELY_UNLIMITED,
    },
    spend: await summariseSpend(
      authorTotals.map((row) => ({
        actorId: row.actorId,
        credits: creditsOf(row),
      })),
      actionTotals.flatMap((row) =>
        isSpendAction(row.action)
          ? [{ action: row.action, credits: creditsOf(row) }]
          : [],
      ),
    ),
    seats,
  };
}

const creditsOf = (row: { _sum: { creditsCharged: number | null } }): number =>
  row._sum.creditsCharged ?? 0;

async function summariseSpend(
  authors: { actorId: string | null; credits: number }[],
  actions: { action: SpendAction; credits: number }[],
): Promise<BillingUsageOverview["spend"]> {
  const ranked = [...authors].sort((a, b) => b.credits - a.credits);

  const listed = ranked.slice(0, AUTHOR_ROWS);
  const remainder = ranked.slice(AUTHOR_ROWS);

  const names = await db.user.findMany({
    where: {
      id: { in: listed.flatMap((row) => (row.actorId ? [row.actorId] : [])) },
    },
    select: { id: true, name: true, email: true },
  });
  const nameOf = new Map(
    names.map((user) => [user.id, user.name || user.email] as const),
  );

  return {
    total: ranked.reduce((sum, row) => sum + row.credits, 0),
    byAuthor: listed.map((row) => ({
      actorId: row.actorId,

      name: row.actorId ? (nameOf.get(row.actorId) ?? null) : null,
      credits: row.credits,
    })),
    otherAuthors: remainder.length
      ? {
          authors: remainder.length,
          credits: remainder.reduce((sum, row) => sum + row.credits, 0),
        }
      : null,
    byAction: [...actions].sort((a, b) => b.credits - a.credits),
  };
}
