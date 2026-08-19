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

  const common = {
    key: `deletion-${partIndex}`,
    partIndex,
    approval: approvalId
      ? { approvalId, toolCallId: part.toolCallId }
      : undefined,
    status: deletionStatus(part),
    errorText: part.state === "output-error" ? part.errorText : undefined,
  };

  if (part.type === "tool-deleteScenes") {
    const { scenes, reason, courseId } = part.input;
    if (!scenes.length) return null;

    const firstSceneWithLesson = scenes.find((scene) => scene.lessonId);

    return {
      ...common,
      kind: "scene",
      items: scenes.map((scene) => ({
        id: scene.sceneId,
        title: scene.title,
        subtitle: scene.lessonTitle,
        lessonId: scene.lessonId,
      })),
      reason: reason?.trim() || undefined,
      courseId,
      focusLesson:
        firstSceneWithLesson?.lessonId != null
          ? {
              id: firstSceneWithLesson.lessonId,
              title: firstSceneWithLesson.lessonTitle,
            }
          : undefined,
    };
  }

  const { lessons, reason, courseId } = part.input;
  if (!lessons.length) return null;

  return {
    ...common,
    kind: "lesson",
    items: lessons.map((lesson) => ({
      id: lesson.lessonId,
      title: lesson.title,
    })),
    reason: reason?.trim() || undefined,
    courseId,
    focusLesson:
      lessons.length === 1
        ? { id: lessons[0]!.lessonId, title: lessons[0]!.title }
        : undefined,
  };
}

// One card per tool call, never a merge of several, so what the author reads above Approve is the whole of what that click deletes — merging calls would mean consent to something unread.
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
