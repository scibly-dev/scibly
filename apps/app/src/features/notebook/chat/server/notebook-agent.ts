import type { SourceContextTier } from "@/features/notebook/chat/server/utils/context";
import type { NotebookRuntimeContext } from "@/features/notebook/tools/runtime-context";

import {
  isStepCount,
  type LanguageModel,
  ToolLoopAgent,
  type ToolSet,
} from "ai";

import { APPROVAL_GATED_TOOL_APPROVAL } from "@/features/notebook/chat/tools/client-tool-definitions";
import {
  READ_SOURCE_TOOL,
  SEARCH_NOTEBOOK_SOURCES_TOOL,
} from "@/features/notebook/sources/server/source-notebook-tools";

interface CreateNotebookAgentParams {
  model: LanguageModel;
  instructions: string;
  tools: ToolSet;
  runtimeContext: NotebookRuntimeContext;
  supportsTools: boolean;
  sourceTier: SourceContextTier;
}

const SOURCE_RETRIEVAL_TOOLS: string[] = [
  SEARCH_NOTEBOOK_SOURCES_TOOL,
  READ_SOURCE_TOOL,
];

function resolveActiveTools(
  tools: ToolSet,
  supportsTools: boolean,
  sourceTier: SourceContextTier,
): string[] {
  if (!supportsTools) {
    return [];
  }

  const names = Object.keys(tools);

  return sourceTier === 1
    ? names.filter((name) => !SOURCE_RETRIEVAL_TOOLS.includes(name))
    : names;
}

export function createNotebookAgent({
  model,
  instructions,
  tools,
  runtimeContext,
  supportsTools,
  sourceTier,
}: CreateNotebookAgentParams) {
  return new ToolLoopAgent({
    model,
    instructions,
    tools,
    runtimeContext,
    toolApproval: APPROVAL_GATED_TOOL_APPROVAL,

    stopWhen: isStepCount(20),
    prepareCall: (call) => ({
      ...call,
      activeTools: resolveActiveTools(tools, supportsTools, sourceTier),
    }),
  });
}
