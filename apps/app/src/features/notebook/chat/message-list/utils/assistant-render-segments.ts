import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookUITools } from "@/features/notebook/chat/tools/index";
import type {
  AssistantRenderSegment,
  ThinkingTimelineEntry,
} from "./assistant-render-segment.types";

import {
  getStaticToolName,
  isReasoningUIPart,
  isStaticToolUIPart,
  isTextUIPart,
} from "ai";

import { isInlineDeletionConfirmationPart } from "./tool-helpers";

export type {
  AssistantRenderSegment,
  ThinkingTimelineEntry,
} from "./assistant-render-segment.types";

function isTransparentAssistantPart(
  part: NotebookMessage["parts"][number],
): boolean {
  if (part.type === "step-start") return true;
  if (isTextUIPart(part) && !part.text.trim()) return true;
  return false;
}

function isInlineAssistantToolPart(
  part: NotebookMessage["parts"][number],
): boolean {
  if (!isStaticToolUIPart(part)) return false;

  const toolName = getStaticToolName<NotebookUITools>(part);

  return (
    toolName === "askMultipleChoice" ||
    toolName === "proposePlan" ||
    toolName === "generateImage" ||
    isInlineDeletionConfirmationPart(part)
  );
}

function isThinkingGroupMember(
  part: NotebookMessage["parts"][number],
): boolean {
  if (isReasoningUIPart(part)) return true;

  return isStaticToolUIPart(part) && !isInlineAssistantToolPart(part);
}

interface ThinkingSegmentScan {
  segment?: Extract<AssistantRenderSegment, { type: "thinking" }>;
  nextIndex: number;
}

function collectThinkingSegment(
  message: NotebookMessage,
  startIndex: number,
): ThinkingSegmentScan {
  const entries: ThinkingTimelineEntry[] = [];
  let index = startIndex;
  while (index < message.parts.length) {
    const current = message.parts[index]!;
    if (isTransparentAssistantPart(current)) {
      index += 1;
      continue;
    }
    if (!isThinkingGroupMember(current)) break;
    if (isReasoningUIPart(current)) {
      if (current.text.trim()) {
        entries.push({
          type: "reasoning",
          text: current.text,
          partIndex: index,
        });
      }
    } else if (isStaticToolUIPart(current)) {
      entries.push({ type: "tool", part: current, partIndex: index });
    }
    index += 1;
  }
  return {
    segment: entries.length
      ? {
          type: "thinking",
          key: `thinking-${startIndex}`,
          entries,
          partEndIndex: index - 1,
        }
      : undefined,
    nextIndex: index,
  };
}

// One segment per run of parts, classified in a single pass from what the part is, never from what follows it — a later part cannot demote a paragraph the author is already reading.
export function buildAssistantRenderSegments(
  message: NotebookMessage,
): AssistantRenderSegment[] {
  const segments: AssistantRenderSegment[] = [];
  const { parts } = message;
  let index = 0;

  while (index < parts.length) {
    const part = parts[index]!;

    if (isTransparentAssistantPart(part)) {
      index += 1;
      continue;
    }

    if (isThinkingGroupMember(part)) {
      const collected = collectThinkingSegment(message, index);
      index = collected.nextIndex;
      if (collected.segment) segments.push(collected.segment);
      continue;
    }

    if (isTextUIPart(part) && part.text.trim()) {
      segments.push({
        type: "text",
        key: `text-${index}`,
        text: part.text,
        partIndex: index,
      });
      index += 1;
      continue;
    }

    if (isStaticToolUIPart(part) && isInlineAssistantToolPart(part)) {
      segments.push({
        type: "inline-tool",
        key: `inline-tool-${index}`,
        part,
        partIndex: index,
      });
      index += 1;
      continue;
    }

    index += 1;
  }

  return segments;
}

export function isThinkingSegmentActive(
  message: NotebookMessage,
  partEndIndex: number,
  isChatLoading: boolean,
  isNewestTurn: boolean,
): boolean {
  if (!isChatLoading || !isNewestTurn) return false;

  for (let index = partEndIndex + 1; index < message.parts.length; index += 1) {
    const part = message.parts[index]!;
    if (isTextUIPart(part) && part.text.trim()) return false;
  }

  return true;
}

export function messageHasThinkingSegments(message: NotebookMessage): boolean {
  for (const part of message.parts) {
    if (part.type === "step-start") continue;
    if (isReasoningUIPart(part)) return true;
    if (isStaticToolUIPart(part) && !isInlineAssistantToolPart(part)) {
      return true;
    }
  }

  return false;
}
