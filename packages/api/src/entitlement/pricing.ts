import { type SpendAction } from "@scibly/db/topup-catalogue";

// The only place a price is set, so the charge and any quote of it can't drift apart.
export const GENERATION_COST = {
  CHAT_MESSAGE: 1,
  IMAGE_GENERATION: 1,
  SOURCE_INGEST: 1,
  KNOWLEDGE_EXTRACT: 1,
} as const satisfies Record<SpendAction, number>;

export const quoteGenerations = (action: SpendAction, runs: number): number =>
  GENERATION_COST[action] * runs;
