import { CreditAction } from "../schema/generated/prisma/enums";

// Ledger actions that spend generations, excluding `TOPUP_PURCHASE` — spend summaries must not count a purchase as a generation run.
export const SPEND_ACTIONS = [
  CreditAction.CHAT_MESSAGE,
  CreditAction.IMAGE_GENERATION,
  CreditAction.SOURCE_INGEST,
] as const;

export type SpendAction = (typeof SPEND_ACTIONS)[number];

export const isSpendAction = (action: CreditAction): action is SpendAction =>
  SPEND_ACTIONS.some((spend) => spend === action);
