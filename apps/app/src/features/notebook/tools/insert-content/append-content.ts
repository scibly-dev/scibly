import type { Editor } from "@tiptap/react";

import {
  executeAppendContent,
  performBackgroundAppendContent,
} from "@/features/course-authoring/client";

import {
  type ClientToolContext,
  getClientToolErrorMessage,
  resolveTargetScene,
} from "./client-types";

export type AppendContentToSceneOutput = {
  success: boolean;
  error?: string;
};

export type AppendContentToSceneParams = {
  sceneId?: string;
  html: string;
  editor: Editor | null;
  activeSceneId: string | undefined;
  websocketProvider: ClientToolContext["websocketProvider"];
};

export async function appendContentToScene({
  sceneId,
  html,
  editor,
  activeSceneId,
  websocketProvider,
}: AppendContentToSceneParams): Promise<AppendContentToSceneOutput> {
  const {
    targetSceneId,
    editor: resolvedEditor,
    error,
  } = resolveTargetScene(sceneId, {
    editor,
    activeSceneId,
    websocketProvider,
    addToolOutput: () => {},
  });

  if (error) {
    return { success: false, error };
  }

  if (resolvedEditor) {
    const output = executeAppendContent({
      editor: resolvedEditor,
      toolCall: { input: { html } },
    });
    return {
      success: output.success,
      error: output.success ? undefined : output.error,
    };
  }

  try {
    const result = await performBackgroundAppendContent({
      sceneId: targetSceneId,
      html,
      websocketProvider,
    });
    return { success: result.success, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: getClientToolErrorMessage(error) || "Background append failed",
    };
  }
}
