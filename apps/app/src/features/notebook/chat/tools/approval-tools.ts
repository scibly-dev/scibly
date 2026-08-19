import {
  type DynamicToolUIPart,
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  type ToolUIPart,
  type UIMessage,
} from "ai";

import { isApprovalGatedTool } from "./client-tool-definitions";

export const APPROVAL_GATED_TOOLS_SYSTEM_PROMPT = `## Approval-gated tools

Some tools require explicit user approval via an inline confirmation card in chat. Do not duplicate that confirmation in plain text — call the tool and let the UI handle it.

When the user approves and the tool finishes, read the tool result and reply with a brief summary. Stop there unless the user sends a new message asking for more.`;

function isApprovalGatedPart(
  part: UIMessage["parts"][number],
): part is ToolUIPart | DynamicToolUIPart {
  return isToolUIPart(part) && isApprovalGatedTool(getToolName(part));
}

function hasPostToolContinuation(message: UIMessage): boolean {
  const lastGated = message.parts.findLastIndex(isApprovalGatedPart);
  if (lastGated < 0) return false;

  return message.parts
    .slice(lastGated + 1)
    .some(
      (part) =>
        part.type === "step-start" ||
        part.type === "text" ||
        part.type === "reasoning",
    );
}

// Not the SDK's `lastAssistantMessageIsCompleteWithApprovalResponses`: that needs
// a part still in `approval-responded`, but a browser-run approval is already
// `output-available` by the same tick, and it has no guard against `useChat`
// re-checking after every stream finish and resending forever.
export function shouldSendAfterApprovalResponses<UiMessage extends UIMessage>({
  messages,
}: {
  messages: UiMessage[];
}): boolean {
  const message = messages.at(-1);
  if (!message || message.role !== "assistant") return false;

  const gatedParts = message.parts.filter(isApprovalGatedPart);
  if (gatedParts.length === 0) return false;
  if (hasPostToolContinuation(message)) return false;

  const denied = gatedParts.filter((part) => part.approval?.approved === false);
  if (denied.length > 0) {
    return denied.every((part) => part.state === "approval-responded");
  }

  const approved = gatedParts.filter(
    (part) => part.approval?.approved === true,
  );
  if (approved.length === 0) return false;

  return approved.every(
    (part) =>
      part.state === "output-available" || part.state === "output-error",
  );
}

/**
 * Every `useChat` in the app takes this as `sendAutomaticallyWhen`.
 *
 * It is what continues an assistant turn with no new user message: answering a
 * multiple-choice or plan card calls `addToolOutput`, which resolves the tool
 * part in place and leaves this true, so the SDK resubmits on its own. A demo
 * chat that omitted it left every card-answered turn stranded mid-reply.
 */
export function shouldSendChatAutomatically<
  UiMessage extends UIMessage,
>(params: { messages: UiMessage[] }): boolean {
  return (
    shouldSendAfterApprovalResponses(params) ||
    lastAssistantMessageIsCompleteWithToolCalls(params)
  );
}
