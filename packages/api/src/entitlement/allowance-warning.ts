import { type Prisma } from "@scibly/db/client";
import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";

import { spendableCredits } from "./credits";

// Ordered most urgent first, so an organization below both lines is reported at the higher one.
const ALLOWANCE_WARNING_THRESHOLDS = [95, 80] as const;

export type AllowanceWarningThreshold =
  (typeof ALLOWANCE_WARNING_THRESHOLDS)[number];

export type AllowanceWarning = {
  threshold: AllowanceWarningThreshold;

  remaining: number;
  allowance: number;

  periodKey: string;
};

const thresholdReached = (
  remaining: number,
  allowance: number,
): AllowanceWarningThreshold | null =>
  ALLOWANCE_WARNING_THRESHOLDS.find(
    (threshold) => remaining * 100 <= allowance * (100 - threshold),
  ) ?? null;

type AllowanceState = AllowanceWarning & {
  periodStart: Date;
  notified: number;
};

const readAllowanceState = async (
  db: Prisma.TransactionClient,
  organizationId: string,
): Promise<AllowanceState | null> => {
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
        notifiedAllowanceThreshold: true,
        periodStart: true,
      },
    }),
  ]);

  const plan = subscription ? PLAN_CATALOGUE[subscription.plan] : undefined;
  if (!plan || !credit) return null;

  const allowance: number = plan.generations.amount;
  if (allowance === 0) return null;

  const remaining = spendableCredits(credit);

  const threshold = thresholdReached(remaining, allowance);
  if (threshold === null) return null;

  return {
    threshold,
    remaining,
    allowance,
    periodKey: credit.periodStart.toISOString(),
    periodStart: credit.periodStart,
    notified: credit.notifiedAllowanceThreshold,
  };
};

// A pure read — decides and records nothing, safe on every settings page load.
export const readAllowanceWarning = async (
  db: Prisma.TransactionClient,
  organizationId: string,
): Promise<AllowanceWarning | null> => {
  const state = await readAllowanceState(db, organizationId);
  if (!state) return null;
  const { threshold, remaining, allowance, periodKey } = state;
  return { threshold, remaining, allowance, periodKey };
};

// Guarded `updateMany` serializes concurrent claims and is matched on `periodStart` so a mid-flight renewal can't be marked already-warned.
export const claimAllowanceWarning = async (
  db: Prisma.TransactionClient,
  organizationId: string,
): Promise<AllowanceWarning | null> => {
  const state = await readAllowanceState(db, organizationId);
  if (!state) return null;

  const { threshold, remaining, allowance, periodKey, periodStart, notified } =
    state;
  if (notified >= threshold) return null;

  const { count } = await db.organizationCredit.updateMany({
    where: {
      organizationId,
      periodStart,
      notifiedAllowanceThreshold: { lt: threshold },
    },
    data: { notifiedAllowanceThreshold: threshold },
  });

  return count > 0 ? { threshold, remaining, allowance, periodKey } : null;
};
