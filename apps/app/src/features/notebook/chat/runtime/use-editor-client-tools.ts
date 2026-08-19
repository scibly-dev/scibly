"use client";

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { RefObject } from "react";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { api } from "@/shared/api/trpc/client";

import {
  type ChatAddToolOutputFunction,
  type ChatOnToolCallCallback,
} from "ai";
import { useEffect } from "react";

import {
  type ClientToolCall,
  type ClientToolOutput,
  handleClientToolCall,
} from "@/features/notebook/tools/insert-content/client";
import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";

import { useCourseBuilderStore } from "../../course-builder/course-builder-store";
import { announceAgentScene } from "../../course-builder/hooks/announce-agent-scene";
import { invalidateCourseSceneState } from "../../course-builder/hooks/invalidate-course-scene-state";
import { useLatestRef } from "./use-latest-ref";

type WebsocketProvider =
  HocuspocusProvider["configuration"]["websocketProvider"];

type ChatUtils = ReturnType<typeof api.useUtils>;

interface EditorClientToolsOptions {
  activeNotebookIdRef: RefObject<string | undefined>;
  websocketProviderRef: RefObject<WebsocketProvider | null | undefined>;
  utils: ChatUtils;
  addToolOutput: ChatAddToolOutputFunction<NotebookMessage>;
  onToolCallRef: RefObject<ChatOnToolCallCallback<NotebookMessage>>;
}

export function useEditorClientTools(options: EditorClientToolsOptions) {
  const {
    activeNotebookIdRef,
    websocketProviderRef,
    utils,
    addToolOutput,
    onToolCallRef,
  } = options;
  const utilsRef = useLatestRef(utils);
  const addToolOutputRef = useLatestRef(addToolOutput);

  useEffect(() => {
    onToolCallRef.current = ({ toolCall }) => {
      if (toolCall.dynamic) return;
      const { toolName, input } = toolCall;
      if (toolName !== "insertContent" && toolName !== "getSceneContent") {
        return;
      }

      const clientToolCall: ClientToolCall = {
        toolCallId: toolCall.toolCallId,
        toolName,
        input,
      };

      const { activeScene } = useCourseBuilderStore.getState();
      const editor = useQuestionBlockStore.getState().editor;

      void handleClientToolCall(clientToolCall, {
        editor,
        activeSceneId: activeScene?.id,
        websocketProvider: websocketProviderRef.current,
        hasLinkedNotebook: !!activeNotebookIdRef.current,
        recordSceneLineage: async (params) => {
          const result =
            await utilsRef.current.client.scene.setSceneLineage.mutate({
              ...params,
              notebookId: activeNotebookIdRef.current,
            });

          invalidateCourseSceneState(utilsRef.current, {
            courseId: result.courseId,
            lessonIds: [result.lessonId],
          });
        },
        announceTargetScene: (sceneId) =>
          announceAgentScene(sceneId, utilsRef.current),
        fetchSceneSourceIds: async (sceneId) => {
          const result =
            await utilsRef.current.client.scene.getSceneLineage.query({
              sceneId,
            });
          return result.sourceIds;
        },

        addToolOutput: (output: ClientToolOutput) => {
          if ("sourceIds" in output) {
            addToolOutputRef.current({
              tool: "getSceneContent",
              toolCallId: toolCall.toolCallId,
              output,
            });
          } else {
            addToolOutputRef.current({
              tool: "insertContent",
              toolCallId: toolCall.toolCallId,
              output,
            });
          }
        },
      });
    };
  }, [
    activeNotebookIdRef,
    websocketProviderRef,
    onToolCallRef,
    utilsRef,
    addToolOutputRef,
  ]);
}
