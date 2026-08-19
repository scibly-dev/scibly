"use client";

import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookTranslations } from "../../../i18n/notebook.types";

import { memo } from "react";

import { getNotebookMessageText } from "@/features/notebook/chat/get-notebook-message-text";

import { AssistantTurnContent } from "./assistant-turn-content";
import { ThinkingDots } from "./thinking-dots";
import { UserMessageBubble } from "./user-message-bubble";

interface ChatTurnProps {
  userMessage?: NotebookMessage;
  assistantMessage?: NotebookMessage;
  index: number;
  totalTurns: number;
  isChatLoading: boolean;
  isCompacting: boolean;
  t: NotebookTranslations;
  onRetryMessage?: (text: string) => void;
}

export const ChatTurn = memo(function ChatTurn({
  userMessage,
  assistantMessage,
  index,
  totalTurns,
  isChatLoading,
  isCompacting,
  t,
  onRetryMessage,
}: ChatTurnProps) {
  const userText = getNotebookMessageText(userMessage);
  const isNewestTurn = index === totalTurns - 1;
  const canCopy = !isNewestTurn || !isChatLoading;

  return (
    <>
      <UserMessageBubble
        message={userMessage}
        text={userText}
        canCopy={canCopy}
      />
      <AssistantTurnContent
        message={assistantMessage}
        userText={userText}
        canCopy={canCopy}
        isChatLoading={isChatLoading}
        isNewestTurn={isNewestTurn}
        t={t}
        onRetryMessage={onRetryMessage}
      />

      {isNewestTurn && isChatLoading && !assistantMessage && (
        <div className="pr-2">
          {isCompacting ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t.chat.summarizingHistory}
            </p>
          ) : (
            <ThinkingDots />
          )}
        </div>
      )}
    </>
  );
});
