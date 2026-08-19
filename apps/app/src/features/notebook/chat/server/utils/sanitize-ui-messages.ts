import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { AnyNotebookToolPart } from "@/features/notebook/chat/tools/tool-parts";

import { isToolUIPart } from "ai";

import { serializeToolResult } from "@/shared/ai/tools/serialize-tool-result";

const NEVER_RETURNED =
  "This call never returned: the turn ended before the browser answered it.";

// Providers reject the whole request over one call left without a result, so a
// call still waiting on a browser that will never answer needs one synthesized;
// `approval-responded` is untouched because the agent still executes it this turn.
function resolveUnansweredCall(part: AnyNotebookToolPart): AnyNotebookToolPart {
  if (part.state === "approval-requested") {
    return {
      ...part,
      state: "output-denied",
      approval: { ...part.approval, approved: false, reason: NEVER_RETURNED },
    };
  }

  if (part.state === "input-available") {
    return { ...part, state: "output-error", errorText: NEVER_RETURNED };
  }

  return part;
}

export function sanitizeUiMessagesForModel(
  messages: NotebookMessage[],
): NotebookMessage[] {
  return messages.map((message) => {
    if (message.role !== "assistant" || !message.parts?.length) {
      return message;
    }

    let changed = false;
    const parts = message.parts.map((part) => {
      if (!isToolUIPart(part)) return part;

      const resolved = resolveUnansweredCall(part);
      if (resolved !== part) changed = true;
      if (!("output" in resolved) || resolved.output === undefined) {
        return resolved;
      }

      changed = true;
      // SAFETY: spreading a union merges its members into one object type.

      return {
        ...resolved,
        output: serializeToolResult(resolved.output),
      } as typeof resolved;
    });

    return changed ? { ...message, parts } : message;
  });
}
