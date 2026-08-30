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
  activeSceneId: string | undefined;

  // Reading and writing are the server's, even for the scene the author has
  // open in front of them: the collab room merges the write back into that
  // editor anyway, and one path means one place content is validated.
  readSceneContent: (
    sceneId: string,
  ) => Promise<{ html: string; sourceIds: string[] }>;
  writeSceneContent: (params: {
    sceneId: string;
    html: string;
    mode: "replace" | "append";
  }) => Promise<void>;

  addToolOutput: (output: ClientToolOutput) => void;
  recordSceneLineage?: (params: {
    sceneId: string;
    sourceIds: string[];
  }) => Promise<void>;

  announceTargetScene?: (sceneId: string) => Promise<void>;
  hasLinkedNotebook?: boolean;
}

export function getClientToolCallInput(
  toolCall: Pick<ClientToolCall, "input">,
): ClientToolCallInput {
  return toolCall.input ?? {};
}

export function getClientToolErrorMessage(err: unknown): string {
  if (err instanceof TRPCClientError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}

/** A tool call that names no scene means the one the author is looking at. */
export function resolveTargetScene(
  sceneIdArg: unknown,
  activeSceneId: string | undefined,
) {
  const targetSceneId =
    (typeof sceneIdArg === "string" ? sceneIdArg : "") || activeSceneId;
  if (!targetSceneId) {
    return {
      targetSceneId: "",
      error: "No active scene and no sceneId provided.",
    };
  }
  return { targetSceneId, error: undefined };
}
