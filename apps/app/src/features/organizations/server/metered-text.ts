import type { SpendAction } from "@scibly/db/topup-catalogue";

import { db } from "@scibly/db";
import { generateText } from "ai";

import "server-only";
import { getLanguageModel } from "@/shared/ai/server/models/registry";

import { fundGeneration } from "./charge-generation";

/** Distributive: a plain `Omit` collapses `{ prompt } | { messages }` into neither. */
type GenerateTextOptions = Parameters<typeof generateText>[0] extends infer O
  ? O extends unknown
    ? Omit<O, "model">
    : never
  : never;

export type MeteredReply = Awaited<ReturnType<typeof generateText>>;

export type MeteredSpend = {
  organizationId: string;
  /** Null for work the funnel and other schedules do on nobody's behalf. */
  actorId: string | null;
  action: SpendAction;
  notebookId?: string;
  /** Whose model to resolve, and whose endpoint to bill or spare. */
  orgSlug: string;
  /** Overrides the organization's default chat model. */
  modelId?: string;
  /** A cheaper tier behind Scibly AI; a BYOAI endpoint keeps its own model. */
  gatewayModel?: string;
};

/**
 * `read` runs inside the funded window, so anything done with the reply is
 * covered by the refund — a caller cannot leave an organization charged for a
 * generation whose result it threw away.
 */
export async function meteredGenerateText<T = string>(
  spend: MeteredSpend,
  options: GenerateTextOptions,
  // SAFETY: the default is only reached when the caller passed no `read`, and
  // a caller that passes none cannot name `T`, so it is `string` here.
  read: (reply: MeteredReply) => T | Promise<T> = (reply) => reply.text as T,
): Promise<T> {
  const { model, isByoai } = await getLanguageModel(
    spend.modelId,
    spend.orgSlug,
    spend.gatewayModel,
  );
  return fundGeneration(
    {
      db,
      organizationId: spend.organizationId,
      actorId: spend.actorId,
      action: spend.action,
      notebookId: spend.notebookId,
      // An organization on its own endpoint pays its provider, not us.
      ownEndpoint: isByoai,
    },
    async () => read(await generateText({ model, ...options })),
  );
}

export function assertNotTruncated(reply: MeteredReply, what: string): void {
  if (reply.finishReason === "length") {
    throw new Error(`${what} was cut off at its output-token limit.`);
  }
}
