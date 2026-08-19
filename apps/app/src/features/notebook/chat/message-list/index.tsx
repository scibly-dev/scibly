"use client";

import type { MessageListProps } from "./message-list.types";

import { cn } from "@scibly/ui/utils";
import { MessageScroller } from "@shadcn/react/message-scroller";
import { ArrowDown, Loader2 } from "lucide-react";
import { useMemo } from "react";

import {
  notebookMessageSurface,
  notebookTimelineSurface,
} from "../../workspace/components/notebook-shell";
import { groupMessagesIntoTurns } from "../messages";
import { ChatTurn } from "./components/chat-turn";
import { useOlderMessagePagination } from "./use-message-pagination";

export function MessageList({
  messages,
  isChatLoading,
  isCompacting,
  hasChats,
  notebookId,
  onRetryMessage,
  t,
}: MessageListProps) {
  const {
    setViewport,
    loadOlderRef,
    isLoadingOlderMessages,
    markUserScrolled,
  } = useOlderMessagePagination(notebookId);

  const chronologicalTurns = useMemo(
    () => groupMessagesIntoTurns(messages),
    [messages],
  );

  return (
    <MessageScroller.Provider autoScroll defaultScrollPosition="last-anchor">
      <MessageScroller.Root
        className={cn(
          "custom-scrollbar relative flex min-h-0 w-full flex-col overflow-hidden transition-all duration-300 ease-in-out",
          notebookTimelineSurface,
          hasChats
            ? "flex-1 opacity-100"
            : "pointer-events-none max-h-0 opacity-0",
        )}
      >
        <MessageScroller.Viewport
          ref={setViewport}
          aria-label="Chat messages"
          className={cn(
            "custom-scrollbar relative flex flex-1 flex-col overflow-y-auto",
            notebookTimelineSurface,
          )}
          onWheel={markUserScrolled}
          onTouchMove={markUserScrolled}
        >
          <MessageScroller.Content className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 pt-2 pb-6">
            <div
              ref={loadOlderRef}
              className="flex h-8 items-center justify-center"
            >
              {isLoadingOlderMessages ? (
                <Loader2
                  className="h-4 w-4 animate-spin text-neutral-400"
                  aria-hidden
                />
              ) : null}
            </div>

            {chronologicalTurns.map((turn, index) => (
              <MessageScroller.Item
                key={turn.id}
                messageId={turn.id}
                scrollAnchor
                className="flex flex-col gap-5"
              >
                <ChatTurn
                  assistantMessage={turn.assistantMessage}
                  index={index}
                  isChatLoading={isChatLoading}
                  isCompacting={isCompacting}
                  onRetryMessage={onRetryMessage}
                  t={t}
                  totalTurns={chronologicalTurns.length}
                  userMessage={turn.userMessage}
                />
              </MessageScroller.Item>
            ))}
          </MessageScroller.Content>
        </MessageScroller.Viewport>

        {/* The scroller marks this inert once the end is already in view. */}
        <MessageScroller.Button
          aria-label={t.chat.scrollToBottom}
          className={cn(
            "absolute bottom-4 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full transition-[opacity,translate] duration-200 data-[active=false]:translate-y-2 data-[active=false]:opacity-0",
            notebookMessageSurface,
          )}
        >
          <ArrowDown
            className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
            aria-hidden
          />
        </MessageScroller.Button>
      </MessageScroller.Root>
    </MessageScroller.Provider>
  );
}
