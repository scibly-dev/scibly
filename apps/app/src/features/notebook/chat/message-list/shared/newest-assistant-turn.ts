import type { NotebookMessage } from "@/features/notebook/chat/contracts";

function getNewestAssistantTurn(
  messages: NotebookMessage[],
): NotebookMessage | undefined {
  const newest = messages[messages.length - 1];
  return newest?.role === "assistant" ? newest : undefined;
}

export function findPendingInNewestTurn<
  T extends { isAnswered: boolean; toolCallId?: string },
>(
  messages: NotebookMessage[],
  getVisible: (message?: NotebookMessage) => T[],
): T | null {
  return (
    getVisible(getNewestAssistantTurn(messages)).find(
      (invocation) => !invocation.isAnswered && invocation.toolCallId,
    ) ?? null
  );
}
