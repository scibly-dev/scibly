import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { AnyNotebookToolPart } from "@/features/notebook/chat/tools/tool-parts";

import { getToolName, isToolUIPart } from "ai";

import { isClientExecutedTool } from "@/features/notebook/chat/tools/client-tool-definitions";

const AUTHOR_PART_TYPES = new Set(["text", "file"]);

// Must be called with the server-stored messages — nothing in the
// `NotebookMessage[]` type stops a client-supplied array from being passed instead.
export function awaitsClientResponse(messages: NotebookMessage[]): boolean {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return false;
  return last.parts.some(
    (part) =>
      isToolUIPart(part) &&
      (part.state === "approval-requested" ||
        (part.state === "input-available" &&
          isClientExecutedTool(getToolName(part)))),
  );
}

// Providers reject a `tool_use` left without a result, so an unissued call
// (`input-streaming`) is dropped whole, while one that reached `execute`
// (`input-available`) becomes an error instead of being silently retried.
export function repairInterruptedToolParts(
  message: NotebookMessage,
): NotebookMessage {
  let changed = false;

  const parts = message.parts
    .filter((part) => {
      if (!isToolUIPart(part) || part.state !== "input-streaming") return true;
      changed = true;
      return false;
    })
    .map((part): NotebookMessage["parts"][number] => {
      if (
        !isToolUIPart(part) ||
        part.state !== "input-available" ||
        isClientExecutedTool(getToolName(part))
      ) {
        return part;
      }

      changed = true;
      return {
        ...part,
        state: "output-error",
        errorText: "The tool call was interrupted before it returned.",
      };
    });

  return changed ? { ...message, parts } : message;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value ?? null, (_key, entry: unknown) =>
    entry && typeof entry === "object" && !Array.isArray(entry)
      ? Object.fromEntries(
          Object.entries(entry).sort(([a], [b]) => a.localeCompare(b)),
        )
      : entry,
  );
}

function sameCall(
  stored: AnyNotebookToolPart,
  incoming: AnyNotebookToolPart,
): boolean {
  if (stored.type !== incoming.type) return false;
  const storedInput = "input" in stored ? stored.input : undefined;
  const incomingInput = "input" in incoming ? incoming.input : undefined;
  return stableStringify(storedInput) === stableStringify(incomingInput);
}

function approvalId(part: AnyNotebookToolPart): string | undefined {
  return "approval" in part ? part.approval?.id : undefined;
}

function patchToolPart(
  stored: AnyNotebookToolPart,
  incoming: AnyNotebookToolPart,
): AnyNotebookToolPart {
  if (!sameCall(stored, incoming)) return stored;

  if (stored.state === "approval-requested") {
    if (
      incoming.state === "approval-responded" ||
      incoming.state === "output-denied"
    ) {
      return incoming;
    }

    if (
      (incoming.state === "output-available" ||
        incoming.state === "output-error") &&
      "approval" in incoming &&
      incoming.approval?.approved === true &&
      approvalId(incoming) === approvalId(stored)
    ) {
      return incoming;
    }

    return stored;
  }

  if (
    stored.state === "input-available" &&
    isClientExecutedTool(getToolName(stored))
  ) {
    return incoming.state === "output-available" ||
      incoming.state === "output-error"
      ? incoming
      : stored;
  }

  return stored;
}

function patchMessageFromClient(
  stored: NotebookMessage,
  incoming: NotebookMessage,
): NotebookMessage {
  const incomingToolParts = new Map<string, AnyNotebookToolPart>();
  for (const part of incoming.parts) {
    if (isToolUIPart(part)) incomingToolParts.set(part.toolCallId, part);
  }
  if (incomingToolParts.size === 0) return stored;

  let changed = false;
  const parts = stored.parts.map((part) => {
    if (!isToolUIPart(part)) return part;
    const match = incomingToolParts.get(part.toolCallId);
    if (!match) return part;
    const patched = patchToolPart(part, match);
    if (patched !== part) changed = true;
    return patched;
  });

  return changed ? { ...stored, parts } : stored;
}

// A resuming client's whole array is read only as a patch onto the stored
// conversation — a message the server never wrote is dropped rather than appended.
export function mergeClientMessagesOntoDbHistory(
  dbMessages: NotebookMessage[],
  clientMessages: NotebookMessage[],
): NotebookMessage[] {
  if (clientMessages.length === 0) return dbMessages;

  const clientById = new Map(
    clientMessages.map((message) => [message.id, message]),
  );

  return dbMessages.map((message) => {
    const incoming = clientById.get(message.id);
    return incoming ? patchMessageFromClient(message, incoming) : message;
  });
}

export function appendAuthorMessage(
  previousMessages: NotebookMessage[],
  incoming: NotebookMessage | undefined,
): NotebookMessage[] {
  if (!incoming || incoming.role !== "user") return previousMessages;

  if (previousMessages.some((message) => message.id === incoming.id)) {
    return previousMessages;
  }

  const parts = incoming.parts.filter((part) =>
    AUTHOR_PART_TYPES.has(part.type),
  );

  return [...previousMessages, { ...incoming, parts }];
}
