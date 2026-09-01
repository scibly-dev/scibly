import type { KnowledgeBundleOutcome } from "@scibly/db/enums";

import { db, Prisma } from "@scibly/db";

import { failureMessage } from "../failure-message";
import { FUNNEL } from "./thresholds";

export type ExtractRequest = {
  organizationId: string;
  bundleId: string;
  topicIds: string[];
};

/** `processedAt: null` keeps a late triage from overwriting a finished extraction. */
export const settleBundlesOp = (
  bundleIds: string[],
  outcome: KnowledgeBundleOutcome,
) =>
  db.knowledgeBundle.updateMany({
    where: { id: { in: bundleIds }, processedAt: null },
    data: {
      outcome,
      processedAt: new Date(),
      content: Prisma.DbNull,
      failureReason: null,
    },
  });

export async function settleBundles(
  bundleIds: string[],
  outcome: KnowledgeBundleOutcome,
): Promise<void> {
  if (bundleIds.length === 0) return;
  await settleBundlesOp(bundleIds, outcome);
}

export async function markUnfunded(bundleId: string): Promise<void> {
  await db.knowledgeBundle.updateMany({
    where: { id: bundleId, processedAt: null },
    data: { outcome: "UNFUNDED", failureReason: null },
  });
}

/** Not terminal: `content` and `processedAt` are left for the nightly sweep to retry. */
export async function recordFunnelFailure(
  bundleIds: string[],
  error: unknown,
): Promise<void> {
  await db.knowledgeBundle.updateMany({
    where: { id: { in: bundleIds }, processedAt: null },
    data: {
      outcome: "FAILED",
      failureReason: failureMessage(error),
      attempts: { increment: 1 },
    },
  });
}

/** Content is kept: giving up is not a judgement about the conversation. */
export async function giveUpOnBundles(bundleIds: string[]): Promise<void> {
  if (bundleIds.length === 0) return;
  await db.knowledgeBundle.updateMany({
    where: { id: { in: bundleIds }, processedAt: null },
    data: { processedAt: new Date() },
  });
}

export const isExhausted = (attempts: number): boolean =>
  attempts >= FUNNEL.maxAttempts;
