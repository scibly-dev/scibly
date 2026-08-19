import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { UnparsedUxCall } from "../shared/unparsed-ux-call";
import type { PlanInvocation } from "./planning.types";

import {
  getToolParts,
  isToolPartDone,
} from "@/features/notebook/chat/tools/tool-parts";
import { parseProposePlanInput } from "@/features/notebook/chat/tools/ux-tools";

import { findPendingInNewestTurn } from "../shared/newest-assistant-turn";
import { findUnparsedUxCall } from "../shared/unparsed-ux-call";
import { hasMeaningfulPlanResponse } from "./planning-utils";

export function getPlanInvocations(
  message?: NotebookMessage,
): PlanInvocation[] {
  if (!message) return [];

  const invocations: PlanInvocation[] = [];

  for (const part of getToolParts(message)) {
    if (part.type !== "tool-proposePlan") continue;

    if (part.state === "input-streaming") continue;

    const parsed = parseProposePlanInput(part.input);
    if (!parsed) continue;

    invocations.push({
      toolCallId: part.toolCallId,
      title: parsed.title,
      summary: parsed.summary,
      steps: parsed.steps,

      isAnswered: isToolPartDone(part),
      answer: part.state === "output-available" ? part.output : undefined,
    });
  }

  return invocations;
}

export function getPlanInvocationForPart(
  message: NotebookMessage | undefined,
  toolCallId: string | undefined,
): PlanInvocation | null {
  if (!message || !toolCallId) return null;

  return (
    getPlanInvocations(message).find(
      (invocation) => invocation.toolCallId === toolCallId,
    ) ?? null
  );
}

export function getInvalidPlanInvocationForPart(
  message: NotebookMessage | undefined,
  toolCallId: string | undefined,
): UnparsedUxCall | null {
  if (getPlanInvocationForPart(message, toolCallId)) return null;

  return findUnparsedUxCall(message, toolCallId, "proposePlan");
}

export function getVisiblePlanInvocations(
  message?: NotebookMessage,
): PlanInvocation[] {
  return getPlanInvocations(message).filter(
    (invocation) =>
      !invocation.isAnswered || hasMeaningfulPlanResponse(invocation.answer),
  );
}

export function getPendingPlanInvocation(
  messages: NotebookMessage[],
): PlanInvocation | null {
  return findPendingInNewestTurn(messages, getVisiblePlanInvocations);
}
