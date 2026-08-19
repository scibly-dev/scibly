import { type Prisma } from "@scibly/db/client";
import { type SpendAction } from "@scibly/db/topup-catalogue";

import { spendableCredits } from "../credits";
import { type Decision } from "../decision";
import { resolveSubscribedPlan } from "../policy";
import { quoteGenerations } from "../pricing";
import { lapsedRefusal } from "./generation-lapse";

// A read-only quote — uses the same pricing and lapse resolution `chargeAiGeneration` runs, so a quote and its charge agree.
type GenerationFunding = {
  credits: number;

  balance: number;

  lapsed: boolean;
  affordable: boolean;
};

export const describeGenerationFunding = async (
  db: Prisma.TransactionClient,
  organizationId: string,
  action: SpendAction,
  runs = 1,
): Promise<GenerationFunding> => {
  const { lapsed } = await resolveSubscribedPlan(db, organizationId);
  const credits = quoteGenerations(action, runs);
  const credit = await db.organizationCredit.findUnique({
    where: { organizationId },
    select: { allowanceRemaining: true, topupRemaining: true },
  });

  const balance = credit ? spendableCredits(credit) : 0;
  return { credits, balance, lapsed, affordable: balance >= credits };
};

function cannotAffordIngestMessage(
  sources: number,
  credits: number,
  balance: number,
): string {
  const what =
    sources === 1
      ? "Indexing this source costs 1 generation"
      : `Indexing these ${sources.toLocaleString()} sources costs ${credits.toLocaleString()} generations`;
  return (
    `${what}, and ${balance.toLocaleString()} ${balance === 1 ? "is" : "are"} left. ` +
    `Purchase a top-up to add ${sources === 1 ? "it" : "them"} — everything already indexed keeps working.`
  );
}

// A precheck only, asking the same questions the charge itself will ask — the debit still does the actual spending.
export const decideIngestFunding = async (
  db: Prisma.TransactionClient,
  organizationId: string,
  action: SpendAction,
  runs = 1,
): Promise<Decision<{ credits: number; balance: number }>> => {
  const { credits, balance, lapsed, affordable } =
    await describeGenerationFunding(db, organizationId, action, runs);

  if (lapsed) {
    return { credits, balance, refusal: lapsedRefusal() };
  }

  if (affordable) {
    return { credits, balance, refusal: null };
  }

  return {
    credits,
    balance,
    refusal: {
      applicationCode: "entitlement.credits_exhausted",
      message: cannotAffordIngestMessage(runs, credits, balance),
      details: { sources: runs, credits, balance },
    },
  };
};
