import {
  normalizeAppError,
  reportAppError,
} from "@scibly/api/application-error/server";

import "server-only";

export const GENERATION_CHARGED_ON_FAILURE_NOTICE =
  "This generation was still charged, since the request had already started.";

export function settleGenerationOnFailure(
  charge: { refund: () => Promise<void> } | null,
) {
  let produced = false;
  return {
    markProduced: () => {
      produced = true;
    },

    keepsCharge: (): boolean => {
      if (!charge) return false;
      if (produced) return true;

      void charge.refund();
      return false;
    },
  };
}

export type GenerationSettlement = ReturnType<typeof settleGenerationOnFailure>;

const CONTEXT_OVERFLOW =
  /context[ _]length|context[ _]window|maximum context|prompt is too long|too many (input )?tokens/i;

export function reportAndSettleStreamError(
  error: unknown,
  params: {
    correlationId: string;
    endpoint: string;
    actorId: string;
    settlement: GenerationSettlement;
  },
): string {
  const charged = params.settlement.keepsCharge();
  if (error instanceof Error && CONTEXT_OVERFLOW.test(error.message)) {
    return "The conversation grew too long mid-response. Please send that message again — it will pick up from a shorter summary.";
  }
  const normalized = normalizeAppError(error, {
    correlationId: params.correlationId,
  });
  reportAppError(normalized, {
    endpoint: params.endpoint,
    actorId: params.actorId,
  });
  return charged
    ? `${normalized.message} ${GENERATION_CHARGED_ON_FAILURE_NOTICE}`
    : normalized.message;
}
