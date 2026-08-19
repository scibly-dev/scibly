"use client";

import type { UxClientToolName } from "@/features/notebook/chat/tools/client-tool-definitions";

import { useEffect } from "react";

import { INVALID_TOOL_INPUT } from "@/features/notebook/chat/tools/ux-tools";

import { useUxToolSubmit } from "./use-ux-tool-submit";

// Auto-submits an error for a tool call the UI can't render, so the model isn't left waiting on input nobody can provide; `useUxToolSubmit`'s `submit` is a no-op mid-stream and stable once the stream settles, so this effect naturally fires once streaming finishes.
export function useMalformedUxToolCall({
  tool,
  toolCallId,
  isAnswered,
}: {
  tool: UxClientToolName;
  toolCallId: string | undefined;
  isAnswered: boolean;
}) {
  const { submit } = useUxToolSubmit({ tool, toolCallId, isAnswered });

  useEffect(() => {
    submit({ error: INVALID_TOOL_INPUT });
  }, [submit]);
}
