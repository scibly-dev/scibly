import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { ImageGenerationInvocation } from "../../../media/generated-image/tool-part";
import type { DeletionInvocation } from "../deletion/deletion.types";
import type { MultipleChoiceQuestionInvocation } from "../multiple-choice/multiple-choice.types";
import type { PlanInvocation } from "../planning/planning.types";

import { getPendingImageGenerationInvocation } from "../../../media/generated-image/tool-part";
import { getPendingDeletionInvocation } from "../deletion/deletion-utils";
import {
  getPendingMultipleChoiceInvocation,
  getPendingPlanInvocation,
} from "../utils/tool-helpers";
import { deliverUxTextAnswer } from "./ux-text-answer-bridge";

interface PendingChatInteraction {
  deletion: DeletionInvocation | null;
  plan: PlanInvocation | null;
  multipleChoice: MultipleChoiceQuestionInvocation | null;
  imageGeneration: ImageGenerationInvocation | null;
}

export function getPendingChatInteraction(
  messages: NotebookMessage[],
): PendingChatInteraction {
  return {
    deletion: getPendingDeletionInvocation(messages),
    plan: getPendingPlanInvocation(messages),
    multipleChoice: getPendingMultipleChoiceInvocation(messages),
    imageGeneration: getPendingImageGenerationInvocation(messages),
  };
}

type ChatSendResolution =
  | { type: "blocked"; message: string }
  | {
      type: "mcq_custom_answer";
      toolCallId: string;
      text: string;

      fallbackMessage: string;
    }
  | { type: "send"; text: string };

interface ResolveChatSendActionInput {
  text: string;
  pending: PendingChatInteraction;
  messages: {
    deletionPendingApproval: string;
    planPendingApproval: string;
    multipleChoicePendingApproval: string;
    imageGenerationPendingApproval: string;
  };
}

function resolveChatSendAction({
  text,
  pending,
  messages,
}: ResolveChatSendActionInput): ChatSendResolution {
  if (pending.deletion) {
    return { type: "blocked", message: messages.deletionPendingApproval };
  }

  if (pending.plan) {
    return { type: "blocked", message: messages.planPendingApproval };
  }

  if (pending.imageGeneration) {
    return {
      type: "blocked",
      message: messages.imageGenerationPendingApproval,
    };
  }

  if (pending.multipleChoice?.toolCallId) {
    return {
      type: "mcq_custom_answer",
      toolCallId: pending.multipleChoice.toolCallId,
      text,
      fallbackMessage: messages.multipleChoicePendingApproval,
    };
  }

  return { type: "send", text };
}

interface ChatSendHandlers {
  sendMessage: (input: { text: string }) => void;
  notify: (message: string) => void;

  onSubmitted?: () => void;
}

// One Enter, one meaning: text that answered the question on screen never also starts a turn, and text with no card left to take it tells the author instead of disappearing.
export function applyChatSendAction(
  input: ResolveChatSendActionInput,
  handlers: ChatSendHandlers,
): void {
  const resolution = resolveChatSendAction(input);

  if (resolution.type === "blocked") {
    handlers.notify(resolution.message);
    return;
  }

  if (resolution.type === "mcq_custom_answer") {
    const answered = deliverUxTextAnswer(
      resolution.toolCallId,
      resolution.text,
    );
    if (!answered) handlers.notify(resolution.fallbackMessage);
    handlers.onSubmitted?.();
    return;
  }

  handlers.sendMessage({ text: resolution.text });
  handlers.onSubmitted?.();
}
