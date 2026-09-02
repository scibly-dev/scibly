import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type {
  DeletionDisplayStatus,
  DeletionInvocation,
  DeletionToolPart,
} from "./deletion.types";

import { isInlineDeletionConfirmationPart } from "../utils/tool-helpers";

function deletionStatus(part: DeletionToolPart): DeletionDisplayStatus {
  switch (part.state) {
    case "input-available":
      return "streaming";
    case "approval-requested":
      return "awaiting-approval";
    case "output-available":
      return "deleted";
    case "output-denied":
      return "denied";
    case "output-error":
      return "failed";
    case "approval-responded":
      return part.approval.approved ? "deleted" : "denied";
  }
}

function parseDeletionPart(
  part: DeletionToolPart,
  partIndex: number,
): DeletionInvocation | null {
  const approvalId = part.approval?.id;

  if (part.state === "output-error" && approvalId == null) return null;

  if (!part.input) return null;

  const { courseId, reason } = part.input;
  // Transcripts written before deletions became ids-only carry no id list.
  const ids =
    part.type === "tool-deleteScenes"
      ? part.input.sceneIds
      : part.input.lessonIds;
  if (!Array.isArray(ids) || ids.length === 0 || !courseId) return null;

  return {
    key: `deletion-${partIndex}`,
    partIndex,
    approval: approvalId
      ? { approvalId, toolCallId: part.toolCallId }
      : undefined,
    status: deletionStatus(part),
    errorText: part.state === "output-error" ? part.errorText : undefined,
    kind: part.type === "tool-deleteScenes" ? "scene" : "lesson",
    ids,
    courseId,
    reason: reason?.trim() || undefined,
  };
}

export function getDeletionInvocations(
  message?: NotebookMessage,
): DeletionInvocation[] {
  if (!message) return [];

  const invocations: DeletionInvocation[] = [];

  for (let partIndex = 0; partIndex < message.parts.length; partIndex += 1) {
    const part = message.parts[partIndex]!;
    if (!isInlineDeletionConfirmationPart(part)) continue;

    const invocation = parseDeletionPart(part, partIndex);
    if (invocation) invocations.push(invocation);
  }

  return invocations;
}

export function getDeletionInvocationForPart(
  message: NotebookMessage | undefined,
  partIndex: number,
): DeletionInvocation | null {
  if (!message) return null;

  return (
    getDeletionInvocations(message).find(
      (invocation) => invocation.partIndex === partIndex,
    ) ?? null
  );
}

export function getPendingDeletionInvocation(
  messages: NotebookMessage[],
): DeletionInvocation | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;

    const pending = getDeletionInvocations(message).find(
      (invocation) =>
        invocation.status === "awaiting-approval" && invocation.approval,
    );
    if (pending) return pending;
  }

  return null;
}
