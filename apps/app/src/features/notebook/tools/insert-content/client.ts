import {
  executeGetSceneContent,
  executeInsertContent,
  performBackgroundInsertion,
  performBackgroundRead,
} from "@/features/course-authoring/client";

import {
  type ClientToolCall,
  type ClientToolContext,
  getClientToolCallInput,
  getClientToolErrorMessage,
  resolveTargetScene,
} from "./client-types";
import { buildQualityWarning } from "./scene-quality";

export {
  appendContentToScene,
  type AppendContentToSceneOutput,
  type AppendContentToSceneParams,
} from "./append-content";
export type {
  ClientToolCall,
  ClientToolCallInput,
  ClientToolContext,
  ClientToolName,
  ClientToolOutput,
  GetSceneContentClientOutput,
  InsertContentClientOutput,
} from "./client-types";

type RawClientToolInput = ReturnType<typeof getClientToolCallInput>;
type ResolvedTarget = ReturnType<typeof resolveTargetScene>;

function addResolutionError(
  toolCall: ClientToolCall,
  ctx: ClientToolContext,
  targetSceneId: string,
  error: string,
  rawArgs: RawClientToolInput,
) {
  ctx.addToolOutput(
    toolCall.toolName === "getSceneContent"
      ? { sceneId: targetSceneId, sourceIds: [], error }
      : { success: false, html: rawArgs.html ?? "", error },
  );
}

async function handleGetSceneContent(
  ctx: ClientToolContext,
  targetSceneId: string,
  editor: ResolvedTarget["editor"],
) {
  const loadSourceIds = () =>
    ctx.fetchSceneSourceIds?.(targetSceneId) ?? Promise.resolve([]);
  if (editor) {
    const output = executeGetSceneContent({
      editor,
      activeSceneId: targetSceneId,
    });
    const sourceIds = await loadSourceIds();
    ctx.addToolOutput({ ...output, sourceIds });
    return;
  }
  try {
    const [res, sourceIds] = await Promise.all([
      performBackgroundRead({
        sceneId: targetSceneId,
        websocketProvider: ctx.websocketProvider,
      }),
      loadSourceIds(),
    ]);
    ctx.addToolOutput({
      html: res.error ? undefined : (res.html ?? ""),
      sceneId: targetSceneId,
      sourceIds,
      error: res.error,
    });
  } catch (error) {
    ctx.addToolOutput({
      sceneId: targetSceneId,
      sourceIds: [],
      error: getClientToolErrorMessage(error) || "Background read failed",
    });
  }
}

async function recordLineage(
  ctx: ClientToolContext,
  sceneId: string,
  sourceIds: string[] | undefined,
  success: boolean,
): Promise<string | undefined> {
  if (!success || !sourceIds?.length || !ctx.recordSceneLineage)
    return undefined;
  try {
    await ctx.recordSceneLineage({ sceneId, sourceIds });
    return undefined;
  } catch (error) {
    const message = getClientToolErrorMessage(error);
    console.error("[ClientTools] setSceneLineage failed:", message);
    return message;
  }
}

function insertionWarnings(
  ctx: ClientToolContext,
  sourceIds: string[] | undefined,
  html: string,
) {
  return {
    groundingWarning:
      ctx.hasLinkedNotebook && !sourceIds?.length
        ? "This scene's course is linked to a notebook with sources. Consider passing `sourceIds` to ground this content, so it can be kept up to date when sources change."
        : undefined,
    qualityWarning: buildQualityWarning(html),
  };
}

function addInsertionOutput(
  ctx: ClientToolContext,
  output: { success: boolean; html: string; error?: string },
  warnings: {
    lineageWarning?: string;
    groundingWarning?: string;
    qualityWarning?: string;
  },
) {
  const applicable = output.success ? warnings : {};
  ctx.addToolOutput({
    ...output,
    lineageWarning: applicable.lineageWarning,
    groundingWarning: applicable.groundingWarning,
    qualityWarning: applicable.qualityWarning,
  });
}

function sourceIdsFrom(rawArgs: RawClientToolInput) {
  if (!Array.isArray(rawArgs.sourceIds)) return undefined;
  return rawArgs.sourceIds.filter((id): id is string => typeof id === "string");
}

async function handleInsertContent(
  toolCall: ClientToolCall,
  ctx: ClientToolContext,
  targetSceneId: string,
  editor: ResolvedTarget["editor"],
  rawArgs: RawClientToolInput,
) {
  const html = typeof rawArgs.html === "string" ? rawArgs.html : "";
  const sourceIds = sourceIdsFrom(rawArgs);
  const { groundingWarning, qualityWarning } = insertionWarnings(
    ctx,
    sourceIds,
    html,
  );
  if (editor) {
    const output = executeInsertContent({ editor, toolCall });
    const lineageWarning = await recordLineage(
      ctx,
      targetSceneId,
      sourceIds,
      output.success,
    );
    addInsertionOutput(ctx, output, {
      lineageWarning,
      groundingWarning,
      qualityWarning,
    });
    return;
  }
  try {
    const result = await performBackgroundInsertion({
      sceneId: targetSceneId,
      html,
      websocketProvider: ctx.websocketProvider,
    });
    const lineageWarning = await recordLineage(
      ctx,
      targetSceneId,
      sourceIds,
      result.success,
    );
    addInsertionOutput(
      ctx,
      { success: result.success, html, error: result.error },
      {
        lineageWarning,
        groundingWarning,
        qualityWarning,
      },
    );
  } catch (error) {
    addInsertionOutput(
      ctx,
      {
        success: false,
        html,
        error: getClientToolErrorMessage(error) || "Background update failed",
      },
      { groundingWarning, qualityWarning },
    );
  }
}

export async function handleClientToolCall(
  toolCall: ClientToolCall,
  ctx: ClientToolContext,
) {
  const { toolName } = toolCall;
  const rawArgs = getClientToolCallInput(toolCall);

  const { targetSceneId, editor, error } = resolveTargetScene(
    rawArgs.sceneId,
    ctx,
  );

  if (error) {
    addResolutionError(toolCall, ctx, targetSceneId, error, rawArgs);
    return;
  }

  if (toolName === "getSceneContent") {
    await handleGetSceneContent(ctx, targetSceneId, editor);
  } else if (toolName === "insertContent") {
    await ctx.announceTargetScene?.(targetSceneId);
    await handleInsertContent(toolCall, ctx, targetSceneId, editor, rawArgs);
  } else {
    console.warn(`[ClientTools] Unknown client tool name: ${toolName}`);
  }
}
