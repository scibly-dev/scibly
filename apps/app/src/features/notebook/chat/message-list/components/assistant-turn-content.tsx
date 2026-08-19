"use client";

import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookTranslations } from "../../../i18n/notebook.types";

import {
  AssistantMessageParts,
  hasAssistantMessageContent,
} from "./assistant-message-parts";

export const AssistantTurnContent = ({
  message,
  userText,
  canCopy,
  isChatLoading,
  isNewestTurn,
  t,
  onRetryMessage,
}: {
  message: NotebookMessage | undefined;
  userText: string;
  canCopy: boolean;
  isChatLoading: boolean;
  isNewestTurn: boolean;
  t: NotebookTranslations;
  onRetryMessage?: (text: string) => void;
}) => {
  if (
    !message ||
    !hasAssistantMessageContent(message, isChatLoading, isNewestTurn)
  )
    return null;
  const onRetry =
    userText.trim() && onRetryMessage
      ? () => onRetryMessage(userText)
      : undefined;
  return (
    <div className="pr-2">
      <div className="max-w-none text-[15px] leading-[1.75] text-neutral-800 dark:text-neutral-200">
        <AssistantMessageParts
          canCopy={canCopy}
          isChatLoading={isChatLoading}
          isNewestTurn={isNewestTurn}
          message={message}
          onRetry={onRetry}
          t={t}
        />
      </div>
    </div>
  );
};
