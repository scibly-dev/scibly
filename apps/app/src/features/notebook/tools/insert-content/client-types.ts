import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor } from "@tiptap/react";

import { TRPCClientError } from "@trpc/client";

export type GetSceneContentClientOutput = {
  html?: string;
  sourceIds: string[];
  sceneId?: string;
  error?: string;
};

export type InsertContentClientOutput = {
  success: boolean;
  html: string;
  error?: string;
  lineageWarning?: string;
  groundingWarning?: string;
  qualityWarning?: string;
};

export type ClientToolOutput =
  | GetSceneContentClientOutput
  | InsertContentClientOutput;

export type ClientToolName = "getSceneContent" | "insertContent";

export type ClientToolCallInput = {
  sceneId?: string;
  html?: string;
  sourceIds?: string[];
};

export type ClientToolCall = {
  toolName: ClientToolName;
  toolCallId: string;
  input?: ClientToolCallInput;
};

export interface ClientToolContext {
  editor: Editor | null;
  activeSceneId: string | undefined;
  websocketProvider:
    | HocuspocusProvider["configuration"]["websocketProvider"]
    | null
    | undefined;
  addToolOutput: (output: ClientToolOutput) => void;
  recordSceneLineage?: (params: {
    sceneId: string;
    sourceIds: string[];
  }) => Promise<void>;
  fetchSceneSourceIds?: (sceneId: string) => Promise<string[]>;

  announceTargetScene?: (sceneId: string) => Promise<void>;
  hasLinkedNotebook?: boolean;
}

interface ResolvedScene {
  targetSceneId: string;
  editor: Editor | null;
  error?: string;
}

export function getClientToolCallInput(
  toolCall: Pick<ClientToolCall, "input">,
): ClientToolCallInput {
  return toolCall.input ?? {};
}

export function getClientToolErrorMessage(err: unknown): string {
  if (err instanceof TRPCClientError) return err.message;
  if (err instanceof Error) return err.message;
  return "Failed to record source lineage.";
}

export function resolveTargetScene(
  sceneIdArg: unknown,
  ctx: ClientToolContext,
): ResolvedScene {
  const sceneId = typeof sceneIdArg === "string" ? sceneIdArg : "";
  const currentActiveSceneId = ctx.activeSceneId;

  if (
    (!sceneId || sceneId === currentActiveSceneId) &&
    ctx.editor &&
    currentActiveSceneId
  ) {
    return { targetSceneId: currentActiveSceneId, editor: ctx.editor };
  }

  const targetSceneId = sceneId || currentActiveSceneId;
  if (!targetSceneId) {
    return {
      targetSceneId: "",
      editor: null,
      error: "No active scene and no sceneId provided.",
    };
  }

  if (!ctx.websocketProvider) {
    return {
      targetSceneId,
      editor: null,
      error: "Collaboration websocket provider not available.",
    };
  }

  return { targetSceneId, editor: null };
}
