import {
  type ClientToolCall,
  type ClientToolContext,
  getClientToolCallInput,
  getClientToolErrorMessage,
  resolveTargetScene,
} from "./client-types";
import { buildQualityWarning } from "./scene-quality";

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
) {
  try {
    const { html, sourceIds } = await ctx.readSceneContent(targetSceneId);
    ctx.addToolOutput({ html, sceneId: targetSceneId, sourceIds });
  } catch (error) {
    // No `html` at all rather than an empty string: a failed read that reads as
    // an empty scene comes back as a write that empties it.
    ctx.addToolOutput({
      sceneId: targetSceneId,
      sourceIds: [],
      error: getClientToolErrorMessage(error) || "Scene read failed",
    });
  }
}

async function recordLineage(
  ctx: ClientToolContext,
  sceneId: string,
  sourceIds: string[] | undefined,
): Promise<string | undefined> {
  if (!sourceIds?.length || !ctx.recordSceneLineage) return undefined;
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

function sourceIdsFrom(rawArgs: RawClientToolInput) {
  if (!Array.isArray(rawArgs.sourceIds)) return undefined;
  return rawArgs.sourceIds.filter((id): id is string => typeof id === "string");
}

async function handleInsertContent(
  ctx: ClientToolContext,
  targetSceneId: string,
  rawArgs: RawClientToolInput,
) {
  const html = typeof rawArgs.html === "string" ? rawArgs.html : "";
  const sourceIds = sourceIdsFrom(rawArgs);

  try {
    await ctx.writeSceneContent({
      sceneId: targetSceneId,
      html,
      mode: "replace",
    });
  } catch (error) {
    // Advice about content that never landed would only mislead, so a refused
    // write carries the reason and nothing else.
    ctx.addToolOutput({
      success: false,
      html,
      error: getClientToolErrorMessage(error) || "Scene write failed",
    });
    return;
  }

  ctx.addToolOutput({
    success: true,
    html,
    lineageWarning: await recordLineage(ctx, targetSceneId, sourceIds),
    ...insertionWarnings(ctx, sourceIds, html),
  });
}

export async function handleClientToolCall(
  toolCall: ClientToolCall,
  ctx: ClientToolContext,
) {
  const { toolName } = toolCall;
  const rawArgs = getClientToolCallInput(toolCall);

  const { targetSceneId, error } = resolveTargetScene(
    rawArgs.sceneId,
    ctx.activeSceneId,
  );

  if (error) {
    addResolutionError(toolCall, ctx, targetSceneId, error, rawArgs);
    return;
  }

  if (toolName === "getSceneContent") {
    await handleGetSceneContent(ctx, targetSceneId);
  } else if (toolName === "insertContent") {
    await ctx.announceTargetScene?.(targetSceneId);
    await handleInsertContent(ctx, targetSceneId, rawArgs);
  } else {
    console.warn(`[ClientTools] Unknown client tool name: ${toolName}`);
  }
}
