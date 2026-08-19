export type CreditBalances = {
  allowanceRemaining: number;
  topupRemaining: number;
};

// Not clamped here — a refund can push a balance past the month's allowance; the "used of" display clamps for itself.
export const spendableCredits = (credit: CreditBalances): number =>
  credit.allowanceRemaining + credit.topupRemaining;
