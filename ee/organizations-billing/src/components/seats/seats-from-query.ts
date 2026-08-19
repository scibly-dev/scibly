import { MAX_SEAT_PURCHASE } from "@scibly/ee-billing/plan-catalogue";

export const seatsFromQuery = (raw: string | null): number => {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), MAX_SEAT_PURCHASE);
};
