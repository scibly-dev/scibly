"use client";

import type { UxClientToolName } from "@/features/notebook/chat/tools/client-tool-definitions";
import type {
  AskMultipleChoiceOutput,
  ProposePlanOutput,
} from "@/features/notebook/chat/tools/ux-tools";

import { useCallback, useRef, useState } from "react";

import { useNotebookActions, useNotebookState } from "../../runtime/context";

type UxToolOutputMap = {
  askMultipleChoice: AskMultipleChoiceOutput;
  proposePlan: ProposePlanOutput;
};

interface UseUxToolSubmitOptions<TTool extends UxClientToolName> {
  tool: TTool;
  toolCallId?: string;
  isAnswered: boolean;
}

export function useUxToolSubmit<TTool extends UxClientToolName>({
  tool,
  toolCallId,
  isAnswered,
}: UseUxToolSubmitOptions<TTool>) {
  const { addToolOutput } = useNotebookActions();
  const { isLoading } = useNotebookState();
  const [pendingToolCallId, setPendingToolCallId] = useState<string | null>(
    null,
  );

  const submittedToolCallIdRef = useRef<string | null>(null);

  const hasToolCallId = Boolean(toolCallId);
  const isSubmitting = Boolean(
    toolCallId && pendingToolCallId === toolCallId && !isAnswered,
  );
  const isInteractive =
    !isAnswered && !isSubmitting && !isLoading && hasToolCallId;

  const submit = useCallback(
    (output: UxToolOutputMap[TTool]) => {
      if (!toolCallId || isAnswered || isSubmitting || isLoading) {
        return false;
      }
      if (submittedToolCallIdRef.current === toolCallId) return false;

      submittedToolCallIdRef.current = toolCallId;
      setPendingToolCallId(toolCallId);
      addToolOutput({
        tool,
        toolCallId,
        output,
      });
      return true;
    },
    [addToolOutput, isAnswered, isLoading, isSubmitting, tool, toolCallId],
  );

  return {
    submit,
    isSubmitting,
    isInteractive,
    hasToolCallId,
  };
}
