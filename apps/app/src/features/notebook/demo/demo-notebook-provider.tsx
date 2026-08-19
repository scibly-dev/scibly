"use client";

import type { ReactNode } from "react";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NotebookContext } from "@/features/notebook/chat/runtime/context";
import { getImageGenerationInvocations } from "@/features/notebook/media/generated-image/tool-part";
import { useSidebarState } from "@/features/notebook/workspace/hooks/use-sidebar-state";

import { shouldResumeDemoReply } from "./demo-chat-transport";
import { DEMO_MODEL } from "./demo-model";
import { DEMO_NOTEBOOK_ID, DEMO_ORG_SLUG } from "./fixture";
import { useShowcaseRuntime, useShowcaseSnapshot } from "./showcase-runtime";

function createDemoContext(values: {
  messages: NotebookMessage[];
  setMessages: ReturnType<typeof useChat<NotebookMessage>>["setMessages"];
  status: ReturnType<typeof useChat<NotebookMessage>>["status"];
  error: Error | undefined;
  imageInvocations: ReturnType<typeof getImageGenerationInvocations>;
  sendMessage: ReturnType<typeof useChat<NotebookMessage>>["sendMessage"];
  stop: ReturnType<typeof useChat<NotebookMessage>>["stop"];
  addToolOutput: ReturnType<typeof useChat<NotebookMessage>>["addToolOutput"];
  addToolApprovalResponse: ReturnType<
    typeof useChat<NotebookMessage>
  >["addToolApprovalResponse"];
  resetChat: () => void;
  updateTitle: (title: string) => void;
  ensureNotebook: () => Promise<string>;
  setCurrentModelId: (id: string) => void;
  title: string;
  currentModelId: string;
}) {
  return {
    state: {
      messages: values.messages,
      setMessages: values.setMessages,
      status: values.status,
      isLoading: values.status === "submitted" || values.status === "streaming",
      isCompacting: false,
      chatError: values.error ?? null,
      creditsExhausted: false,
      isNotebookHistoryLoading: false,
      hasOlderMessages: false,
      isLoadingOlderMessages: false,
      loadOlderMessages: async () => {},
      imageInvocations: values.imageInvocations,
    },
    actions: {
      sendMessage: values.sendMessage,
      stop: values.stop,
      resetChat: values.resetChat,

      retry: () => {},
      addToolOutput: values.addToolOutput,
      addToolApprovalResponse: values.addToolApprovalResponse,
      updateTitle: values.updateTitle,
      ensureNotebook: values.ensureNotebook,
      setCurrentModelId: values.setCurrentModelId,
      acknowledgeCreditsExhausted: () => {},
    },
    meta: {
      notebookId: DEMO_NOTEBOOK_ID,
      orgSlug: DEMO_ORG_SLUG,
      notebookTitle: values.title,
      currentModelId: values.currentModelId,
    },
  };
}

// Nothing sends automatically: the showcase only starts once the visitor
// clicks Send themselves (the composer is pre-filled, never auto-submitted).
function useDemoInitialization(linkedCourse: boolean) {
  useEffect(() => {
    if (linkedCourse)
      useSidebarState.getState().openStudioTool("courseBuilder");
  }, [linkedCourse]);
}

function useDemoActions(
  store: ReturnType<typeof useShowcaseRuntime>["store"],
  setMessages: ReturnType<typeof useChat<NotebookMessage>>["setMessages"],
) {
  const resetChat = useCallback(() => {
    setMessages([]);
    store.reset();
    useSidebarState.getState().clearStudioTool();
  }, [setMessages, store]);
  const updateTitle = useCallback(
    (title: string) => store.updateNotebookTitle(title),
    [store],
  );
  return { resetChat, updateTitle };
}

export function DemoNotebookProvider({ children }: { children: ReactNode }) {
  const { store, transport, devScript } = useShowcaseRuntime();
  const snapshot = useShowcaseSnapshot();
  const sendAutomaticallyWhen = useCallback(
    (params: { messages: NotebookMessage[] }) =>
      shouldResumeDemoReply(devScript, params),
    [devScript],
  );
  const [currentModelId, setCurrentModelId] = useState<string>(DEMO_MODEL.id);
  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    addToolOutput,
    addToolApprovalResponse,
  } = useChat<NotebookMessage>({
    sendAutomaticallyWhen,
    transport,
  });

  useDemoInitialization(Boolean(snapshot.linkedCourse));

  const { resetChat, updateTitle } = useDemoActions(store, setMessages);
  const ensureNotebook = useCallback(
    () => Promise.resolve(DEMO_NOTEBOOK_ID),
    [],
  );
  const imageInvocations = useMemo(
    () => getImageGenerationInvocations(messages),
    [messages],
  );
  const contextValue = useMemo(
    () =>
      createDemoContext({
        messages,
        setMessages,
        status,
        error,
        imageInvocations,
        sendMessage,
        stop,
        addToolOutput,
        addToolApprovalResponse,
        resetChat,
        updateTitle,
        ensureNotebook,
        setCurrentModelId,
        title: snapshot.title,
        currentModelId,
      }),
    [
      addToolApprovalResponse,
      addToolOutput,
      currentModelId,
      ensureNotebook,
      error,
      imageInvocations,
      messages,
      resetChat,
      sendMessage,
      setMessages,
      snapshot.title,
      status,
      stop,
      updateTitle,
    ],
  );

  return <NotebookContext value={contextValue}>{children}</NotebookContext>;
}
