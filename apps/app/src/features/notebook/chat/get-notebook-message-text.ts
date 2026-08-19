import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { isTextUIPart } from "ai";

export function getNotebookMessageText(
  message: NotebookMessage | undefined,
): string {
  if (!message) return "";
  return message.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("\n\n");
}
