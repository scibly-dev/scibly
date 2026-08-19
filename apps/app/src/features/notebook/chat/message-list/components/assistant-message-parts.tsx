"use client";

import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookToolPart } from "@/features/notebook/chat/tools/tool-parts";
import type { NotebookTranslations } from "../../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { isTextUIPart } from "ai";
import { useMemo } from "react";

import { MessageResponse } from "@/shared/ai/components/message";

import { GeneratedImageToolPart } from "../../../media/generated-image/generated-image-tool-part";
import { getImageGenerationInvocationForPart } from "../../../media/generated-image/tool-part";
import { CopyButton } from "../../copy-button";
import { DeletionConfirmationCard } from "../deletion/deletion-confirmation-card";
import { getDeletionInvocationForPart } from "../deletion/deletion-utils";
import { MultipleChoiceCard } from "../multiple-choice/multiple-choice-card";
import { MultipleChoiceSubmissionBubble } from "../multiple-choice/multiple-choice-submission-bubble";
import { PlanningCard } from "../planning/planning-card";
import { PlanningSubmissionBubble } from "../planning/planning-submission-bubble";
import { UxCardSkeleton } from "../shared/ux-card-skeleton";
import { UxErrorCard } from "../shared/ux-error-card";
import {
  type AssistantRenderSegment,
  buildAssistantRenderSegments,
  isThinkingSegmentActive,
  messageHasThinkingSegments,
} from "../utils/assistant-render-segments";
import {
  getInvalidMultipleChoiceInvocationForPart,
  getInvalidPlanInvocationForPart,
  getMultipleChoiceInvocationForPart,
  getPlanInvocationForPart,
  isInlineDeletionConfirmationPart,
} from "../utils/tool-helpers";
import { AgentThinking } from "./agent-thinking";
import { ThinkingDots } from "./thinking-dots";

const ASSISTANT_PROSE =
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-3.5 [&_p:last-child]:mb-0 [&_p]:leading-[1.75] [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:leading-[1.65] [&_strong]:font-semibold [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_pre]:my-3 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] dark:[&_code]:bg-neutral-800";

const assistantCopyRow =
  "flex h-7 w-full items-center justify-start opacity-0 transition-opacity duration-200 delay-300 group-hover/assistant-body:opacity-100 group-hover/assistant-body:delay-0 group-focus-within/assistant-body:opacity-100 group-focus-within/assistant-body:delay-0";

interface AssistantMessagePartsProps {
  message: NotebookMessage;
  t: NotebookTranslations;
  isChatLoading: boolean;
  isNewestTurn: boolean;
  canCopy: boolean;
  onRetry?: () => void;
}

function renderMultipleChoice(
  message: NotebookMessage,
  toolCallId: string | undefined,
  t: NotebookTranslations,
  canCopy: boolean,
) {
  const invocation = getMultipleChoiceInvocationForPart(message, toolCallId);
  if (!invocation) {
    const invalid = getInvalidMultipleChoiceInvocationForPart(
      message,
      toolCallId,
    );
    return invalid ? (
      <div className="mt-4">
        <UxErrorCard
          tool="askMultipleChoice"
          toolCallId={invalid.toolCallId}
          isAnswered={invalid.isAnswered}
          body={t.chat.multipleChoice.invalidQuestion}
        />
      </div>
    ) : null;
  }
  if (invocation.isAnswered) {
    return (
      <MultipleChoiceSubmissionBubble
        canCopy={canCopy}
        invocation={invocation}
        t={t}
      />
    );
  }
  return (
    <div className="mt-4">
      <MultipleChoiceCard invocation={invocation} t={t} />
    </div>
  );
}

function renderPlan(
  message: NotebookMessage,
  toolCallId: string | undefined,
  t: NotebookTranslations,
  canCopy: boolean,
) {
  const invocation = getPlanInvocationForPart(message, toolCallId);
  if (invocation?.isAnswered) {
    return (
      <PlanningSubmissionBubble
        canCopy={canCopy}
        invocation={invocation}
        t={t}
      />
    );
  }
  if (invocation) {
    return (
      <div className="mt-4">
        <PlanningCard invocation={invocation} t={t} />
      </div>
    );
  }
  const invalidPlan = getInvalidPlanInvocationForPart(message, toolCallId);
  return invalidPlan ? (
    <div className="mt-4">
      <UxErrorCard
        tool="proposePlan"
        toolCallId={invalidPlan.toolCallId}
        isAnswered={invalidPlan.isAnswered}
        body={t.chat.planning.invalidPlan}
      />
    </div>
  ) : null;
}

function renderDeletion(
  message: NotebookMessage,
  partIndex: number,
  t: NotebookTranslations,
) {
  const invocation = getDeletionInvocationForPart(message, partIndex);
  if (!invocation) return null;
  return (
    <div className="mt-4">
      <DeletionConfirmationCard invocation={invocation} t={t} />
    </div>
  );
}

function renderGeneratedImage(
  part: NotebookToolPart,
  t: NotebookTranslations,
  onRetry?: () => void,
) {
  const invocation = getImageGenerationInvocationForPart(part);
  if (!invocation) return null;
  return (
    <div className="mt-4">
      <GeneratedImageToolPart invocation={invocation} onRetry={onRetry} t={t} />
    </div>
  );
}

function renderInlineToolPart(
  message: NotebookMessage,
  part: NotebookToolPart,
  partIndex: number,
  t: NotebookTranslations,
  canCopy: boolean,
  onRetry?: () => void,
) {
  if (
    part.type === "tool-askMultipleChoice" ||
    part.type === "tool-proposePlan"
  ) {
    if (part.state === "input-streaming") {
      return (
        <div className="mt-4">
          <UxCardSkeleton />
        </div>
      );
    }
    return part.type === "tool-askMultipleChoice"
      ? renderMultipleChoice(message, part.toolCallId, t, canCopy)
      : renderPlan(message, part.toolCallId, t, canCopy);
  }
  if (part.type === "tool-generateImage")
    return renderGeneratedImage(part, t, onRetry);
  if (isInlineDeletionConfirmationPart(part))
    return renderDeletion(message, partIndex, t);

  return null;
}

interface SegmentViewProps extends AssistantMessagePartsProps {
  segment: AssistantRenderSegment;
  previousSegment: AssistantRenderSegment | undefined;
  lastTextSegmentKey: string | undefined;
}

const SegmentView = ({
  segment,
  previousSegment,
  message,
  t,
  isChatLoading,
  isNewestTurn,
  canCopy,
  onRetry,
  lastTextSegmentKey,
}: SegmentViewProps) => {
  if (segment.type === "thinking") {
    return (
      <div
        className={cn(
          previousSegment &&
            (previousSegment.type === "thinking" ? "mt-3" : "mt-4"),
        )}
      >
        <AgentThinking
          isActive={isThinkingSegmentActive(
            message,
            segment.partEndIndex,
            isChatLoading,
            isNewestTurn,
          )}
          entries={segment.entries}
          labels={t.chat.thinking}
        />
      </div>
    );
  }
  if (segment.type === "text") {
    const isFinalReply = segment.key === lastTextSegmentKey;
    return (
      <div
        className={cn(
          "group/assistant-body w-full",
          previousSegment && "mt-4",
          previousSegment?.type === "thinking" && "mt-3",
        )}
      >
        <MessageResponse
          className={cn("text-[15px] leading-[1.75]", ASSISTANT_PROSE)}
          isAnimating={isChatLoading && isNewestTurn && isFinalReply}
        >
          {segment.text}
        </MessageResponse>
        {canCopy && isFinalReply ? (
          <div className={assistantCopyRow}>
            <CopyButton textToCopy={segment.text} />
          </div>
        ) : null}
      </div>
    );
  }
  return renderInlineToolPart(
    message,
    segment.part,
    segment.partIndex,
    t,
    canCopy,
    onRetry,
  );
};

export function AssistantMessageParts({
  message,
  t,
  isChatLoading,
  isNewestTurn,
  canCopy,
  onRetry,
}: AssistantMessagePartsProps) {
  const segments = useMemo(
    () => buildAssistantRenderSegments(message),
    [message],
  );
  const lastTextSegmentKey = segments
    .filter((segment) => segment.type === "text")
    .at(-1)?.key;

  const hasTextPart = message.parts.some(
    (part) => isTextUIPart(part) && part.text.trim() !== "",
  );

  return (
    <>
      {segments.map((segment, segmentIndex) => (
        <SegmentView
          key={segment.key}
          canCopy={canCopy}
          isChatLoading={isChatLoading}
          isNewestTurn={isNewestTurn}
          lastTextSegmentKey={lastTextSegmentKey}
          message={message}
          onRetry={onRetry}
          previousSegment={segments[segmentIndex - 1]}
          segment={segment}
          t={t}
        />
      ))}

      {isChatLoading && isNewestTurn && !hasTextPart && <ThinkingDots />}
    </>
  );
}

export function hasAssistantMessageContent(
  message: NotebookMessage | undefined,
  isChatLoading: boolean,
  isNewestTurn: boolean,
): boolean {
  if (!message) return false;

  for (const part of message.parts) {
    if (isTextUIPart(part) && part.text.trim()) return true;
    if (part.type === "tool-askMultipleChoice") return true;
    if (part.type === "tool-proposePlan") return true;
    if (part.type === "tool-generateImage") return true;
    if (isInlineDeletionConfirmationPart(part)) return true;
  }

  if (messageHasThinkingSegments(message)) return true;

  return isChatLoading && isNewestTurn;
}
