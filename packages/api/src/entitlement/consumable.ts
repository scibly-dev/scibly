import { type Prisma, type PrismaClient } from "@scibly/db/client";
import { type CreditBucket } from "@scibly/db/enums";
import { type SpendAction } from "@scibly/db/topup-catalogue";

import { AppError } from "../application-error";
import { lapsedRefusal } from "./policies/generation-lapse";
import {
  type EntitlementContext,
  resolveSubscribedPlan,
  unresolvable,
} from "./policy";
import { GENERATION_COST } from "./pricing";

type SpendableBucket = {
  bucket: CreditBucket;
  balanceField: "allowanceRemaining" | "topupRemaining";
};

const ALLOWANCE = {
  bucket: "ALLOWANCE",
  balanceField: "allowanceRemaining",
} as const satisfies SpendableBucket;

const TOPUP = {
  bucket: "TOPUP",
  balanceField: "topupRemaining",
} as const satisfies SpendableBucket;

type Charge = SpendableBucket & {
  entryId: string;
  cost: number;

  periodStart: Date;
};

// Best-effort: never throws — a failed refund is logged, leaving an unrefunded ledger entry for support.
const refundCharge = async (
  db: PrismaClient,
  organizationId: string,
  charge: Charge,
): Promise<void> => {
  try {
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const { count } = await tx.organizationCredit.updateMany({
        where:
          charge.bucket === "ALLOWANCE"
            ? { organizationId, periodStart: charge.periodStart }
            : { organizationId },
        data: { [charge.balanceField]: { increment: charge.cost } },
      });
      if (count === 0) return;
      await tx.creditLedgerEntry.update({
        where: { id: charge.entryId },
        data: { refundedAt: new Date() },
      });
    });
  } catch (refundError) {
    console.error(
      `[entitlement] Refund failed for organization ${organizationId}, ledger entry ${charge.entryId}:`,
      refundError,
    );
  }
};

type ConsumableArgs = {
  action: SpendAction;
  notebookId?: string;
};

export type GenerationCharge = {
  refund: () => Promise<void>;
};

// The debit transaction commits before `operation()` starts, so a failure is undone by the refund below, not a rollback.
export const chargeAiGeneration = async <T>(
  {
    db,
    organizationId,
    actorId,
    action,
    notebookId,
  }: EntitlementContext & ConsumableArgs,
  operation: (charge: GenerationCharge) => Promise<T>,
): Promise<T> => {
  const cost = GENERATION_COST[action];
  const charged = await db.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const { lapsed } = await resolveSubscribedPlan(tx, organizationId);
      if (lapsed) {
        throw new AppError({ code: "PAYMENT_REQUIRED", ...lapsedRefusal() });
      }

      const tryDebit = async (from: SpendableBucket) => {
        const { count } = await tx.organizationCredit.updateMany({
          where: { organizationId, [from.balanceField]: { gte: cost } },
          data: { [from.balanceField]: { decrement: cost } },
        });
        return count > 0 ? from : null;
      };

      let debited = await tryDebit(ALLOWANCE);
      if (!debited) {
        debited = await tryDebit(TOPUP);
      }

      const credit = await tx.organizationCredit.findUnique({
        where: { organizationId },
        select: { periodStart: true },
      });
      if (!credit) {
        throw unresolvable(organizationId, "no credit row");
      }
      if (!debited) return null;

      const entry = await tx.creditLedgerEntry.create({
        data: {
          organizationId,
          actorId,
          notebookId,
          action,
          creditsCharged: cost,
          bucket: debited.bucket,
        },
      });

      return {
        ...debited,
        entryId: entry.id,
        cost,
        periodStart: credit.periodStart,
      };
    },
  );

  if (!charged) {
    throw new AppError({
      code: "PAYMENT_REQUIRED",
      applicationCode: "entitlement.credits_exhausted",
      message: "The organization has no AI generations left.",
    });
  }

  let returned = false;
  const refund = async () => {
    if (returned) return;
    returned = true;
    await refundCharge(db, organizationId, charged);
  };

  try {
    return await operation({ refund });
  } catch (error) {
    await refund();
    throw error;
  }
};
