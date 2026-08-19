import type { DynamicToolUIPart, ToolUIPart } from "ai";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookUITools } from "@/features/notebook/chat/tools/index";
import type { ToolName } from "@/features/notebook/chat/tools/metadata";

import { isStaticToolUIPart } from "ai";

export type NotebookToolPart = ToolUIPart<NotebookUITools>;

// What `isToolUIPart` narrows to — includes the untyped `dynamic-tool` shape
// nothing here emits, but call-answering paths still have to cover it so a provider doesn't reject the conversation.
export type AnyNotebookToolPart = NotebookToolPart | DynamicToolUIPart;

export type NotebookToolPartOf<N extends ToolName> = Extract<
  NotebookToolPart,
  { type: `tool-${N}` }
>;

export function isToolPartDone(part: NotebookToolPart): boolean {
  switch (part.state) {
    case "output-available":
    case "output-error":
    case "output-denied":
      return true;
    default:
      return false;
  }
}

export function getToolParts(message?: NotebookMessage): NotebookToolPart[] {
  return message?.parts.filter(isStaticToolUIPart) ?? [];
}
