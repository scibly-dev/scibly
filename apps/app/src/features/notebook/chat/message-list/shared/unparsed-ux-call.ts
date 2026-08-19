import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { UxClientToolName } from "@/features/notebook/chat/tools/client-tool-definitions";

import {
  getToolParts,
  isToolPartDone,
} from "@/features/notebook/chat/tools/tool-parts";

export interface UnparsedUxCall {
  toolCallId: string;
  isAnswered: boolean;
}

// A settled call whose input the schema rejects: no card to draw, but still a tool call waiting for an output; streaming calls are excluded since their input is incomplete rather than malformed, and parsing them would always fail and answer the call with `invalid_tool_input` prematurely.
export function findUnparsedUxCall(
  message: NotebookMessage | undefined,
  toolCallId: string | undefined,
  tool: UxClientToolName,
): UnparsedUxCall | null {
  if (!message || !toolCallId) return null;

  const part = getToolParts(message).find(
    (candidate) =>
      candidate.type === `tool-${tool}` &&
      candidate.toolCallId === toolCallId &&
      candidate.state !== "input-streaming",
  );

  return part ? { toolCallId, isAnswered: isToolPartDone(part) } : null;
}
