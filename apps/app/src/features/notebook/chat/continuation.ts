import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { isToolUIPart } from "ai";

export function isContinuationRequest(messages: NotebookMessage[]): boolean {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") return true;

  return messages.some((msg) =>
    msg.parts.some(
      (part) =>
        isToolUIPart(part) &&
        (part.state === "approval-responded" || part.state === "output-denied"),
    ),
  );
}
