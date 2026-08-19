"use client";

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { ReactNode } from "react";
import type { NotebookContextValue } from "./context";

import { HocuspocusContext } from "@hocuspocus/provider-react";
import { routes } from "@scibly/routes";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { isQuotaExceededCreditsError } from "@/shared/ai/errors";
import { DEFAULT_MODEL_ID } from "@/shared/ai/models";
import { api } from "@/shared/api/trpc/client";

import { useCourseBuilderStore } from "../../course-builder/course-builder-store";
import { getImageGenerationInvocations } from "../../media/generated-image/tool-part";
import { NotebookContext } from "./context";
import { useChatInstance } from "./use-chat-instance";
import { useLatestRef } from "./use-latest-ref";
import { useMessageHistoryPagination } from "./use-message-history-pagination";
import { useNotebookSync } from "./use-notebook-sync";

interface NotebookProviderProps {
  children: ReactNode;
  orgSlug: string;
  notebookId?: string;
  initialMessage?: string;
}

type WebsocketProvider =
  HocuspocusProvider["configuration"]["websocketProvider"];

function useNotebookModel(
  orgSlug: string,
  websocketProvider: WebsocketProvider | null | undefined,
) {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { data: preferences } = api.orgAiConfig.getPreferences.useQuery({
    orgSlug,
  });
  const currentModelId =
    selectedModelId ?? preferences?.defaultClientModelId ?? DEFAULT_MODEL_ID;
  return {
    currentModelId,
    currentModelIdRef: useLatestRef(currentModelId),
    websocketProviderRef: useLatestRef(websocketProvider),
    setCurrentModelId: useCallback((id: string) => setSelectedModelId(id), []),
  };
}

function useInitialChatMessage(
  initialMessage: string | undefined,
  messageCount: number,
  sendMessage: NotebookContextValue["actions"]["sendMessage"],
) {
  const appended = useRef(false);
  useEffect(() => {
    if (!initialMessage || appended.current || messageCount > 0) return;
    appended.current = true;
    void sendMessage({ text: initialMessage });
  }, [initialMessage, messageCount, sendMessage]);
}

function useMemoizedNotebookContext(value: NotebookContextValue) {
  const { state, actions, meta } = value;
  return useMemo(
    () => ({
      state: {
        messages: state.messages,
        setMessages: state.setMessages,
        status: state.status,
        isLoading: state.isLoading,
        isCompacting: state.isCompacting,
        chatError: state.chatError,
        creditsExhausted: state.creditsExhausted,
        isNotebookHistoryLoading: state.isNotebookHistoryLoading,
        hasOlderMessages: state.hasOlderMessages,
        isLoadingOlderMessages: state.isLoadingOlderMessages,
        loadOlderMessages: state.loadOlderMessages,
        imageInvocations: state.imageInvocations,
      },
      actions: {
        sendMessage: actions.sendMessage,
        stop: actions.stop,
        resetChat: actions.resetChat,
        retry: actions.retry,
        addToolOutput: actions.addToolOutput,
        addToolApprovalResponse: actions.addToolApprovalResponse,
        updateTitle: actions.updateTitle,
        ensureNotebook: actions.ensureNotebook,
        setCurrentModelId: actions.setCurrentModelId,
        acknowledgeCreditsExhausted: actions.acknowledgeCreditsExhausted,
      },
      meta: {
        notebookId: meta.notebookId,
        orgSlug: meta.orgSlug,
        notebookTitle: meta.notebookTitle,
        currentModelId: meta.currentModelId,
      },
    }),
    [
      actions.acknowledgeCreditsExhausted,
      actions.addToolApprovalResponse,
      actions.addToolOutput,
      actions.ensureNotebook,
      actions.resetChat,
      actions.retry,
      actions.sendMessage,
      actions.setCurrentModelId,
      actions.stop,
      actions.updateTitle,
      meta.currentModelId,
      meta.notebookId,
      meta.notebookTitle,
      meta.orgSlug,
      state.chatError,
      state.creditsExhausted,
      state.hasOlderMessages,
      state.isCompacting,
      state.imageInvocations,
      state.isLoading,
      state.isLoadingOlderMessages,
      state.isNotebookHistoryLoading,
      state.loadOlderMessages,
      state.messages,
      state.setMessages,
      state.status,
    ],
  );
}

function useNotebookRuntime(params: {
  orgSlug: string;
  notebookIdProp: string | undefined;
  activeNotebookId: string | undefined;
  activeNotebookIdRef: React.RefObject<string | undefined>;
  setActiveNotebookId: (id: string | undefined) => void;
  model: ReturnType<typeof useNotebookModel>;
  initialMessage: string | undefined;
}) {
  const orgSlugRef = useLatestRef(params.orgSlug);
  const chat = useChatInstance({
    orgSlugRef,
    activeNotebookIdRef: params.activeNotebookIdRef,
    currentModelIdRef: params.model.currentModelIdRef,
    websocketProviderRef: params.model.websocketProviderRef,
    setActiveNotebookId: params.setActiveNotebookId,
  });
  const sync = useNotebookSync({
    orgSlug: params.orgSlug,
    notebookIdProp: params.notebookIdProp,
    activeNotebookId: params.activeNotebookId,
    activeNotebookIdRef: params.activeNotebookIdRef,
    setActiveNotebookId: params.setActiveNotebookId,
    setMessages: chat.setMessages,
  });
  const pagination = useMessageHistoryPagination({
    orgSlug: params.orgSlug,
    notebookId: params.activeNotebookId,
    messages: chat.messages,
    setMessages: chat.setMessages,
    hasOlderMessages: sync.hasOlderMessages,
  });
  useInitialChatMessage(
    params.initialMessage,
    chat.messages.length,
    chat.sendMessage,
  );
  return { chat, sync, pagination };
}

function useProviderContext(params: {
  runtime: ReturnType<typeof useNotebookRuntime>;
  model: ReturnType<typeof useNotebookModel>;
  activeNotebookId: string | undefined;
  orgSlug: string;
  chatError: Error | null;
  creditsExhausted: boolean;
  resetChat: () => void;
  retry: (prompt: string) => void;
  acknowledgeCreditsExhausted: () => void;
}) {
  const { chat, sync, pagination } = params.runtime;
  const isLoading = chat.status === "submitted" || chat.status === "streaming";
  const imageInvocations = useMemo(
    () => getImageGenerationInvocations(chat.messages),
    [chat.messages],
  );
  return useMemoizedNotebookContext({
    state: {
      messages: chat.messages,
      setMessages: chat.setMessages,
      status: chat.status,
      isLoading,
      isCompacting: chat.isCompacting,
      chatError: params.chatError,
      creditsExhausted: params.creditsExhausted,
      isNotebookHistoryLoading: sync.isNotebookHistoryLoading,
      hasOlderMessages: pagination.hasOlderMessages,
      isLoadingOlderMessages: pagination.isLoadingOlder,
      loadOlderMessages: pagination.loadOlderMessages,
      imageInvocations,
    },
    actions: {
      sendMessage: chat.sendMessage,
      stop: chat.stop,
      resetChat: params.resetChat,
      retry: params.retry,
      addToolOutput: chat.addToolOutput,
      addToolApprovalResponse: chat.addToolApprovalResponse,
      updateTitle: sync.updateTitle,
      ensureNotebook: sync.ensureNotebook,
      setCurrentModelId: params.model.setCurrentModelId,
      acknowledgeCreditsExhausted: params.acknowledgeCreditsExhausted,
    },
    meta: {
      notebookId: params.activeNotebookId,
      orgSlug: params.orgSlug,
      notebookTitle: sync.notebook?.title,
      currentModelId: params.model.currentModelId,
    },
  });
}

export function NotebookProvider({
  children,
  orgSlug,
  notebookId: notebookIdProp,
  initialMessage,
}: NotebookProviderProps) {
  const router = useRouter();
  const hocuspocusContext = useContext(HocuspocusContext);

  const [activeNotebookId, setActiveNotebookId] = useState<string | undefined>(
    notebookIdProp === "new" ? undefined : notebookIdProp,
  );
  const activeNotebookIdRef = useLatestRef(activeNotebookId);

  const model = useNotebookModel(orgSlug, hocuspocusContext?.websocketProvider);

  const runtime = useNotebookRuntime({
    orgSlug,
    notebookIdProp,
    activeNotebookId,
    activeNotebookIdRef,
    setActiveNotebookId,
    model,
    initialMessage,
  });
  const { chat, sync } = runtime;
  const { setMessages, error: rawError, clearError, sendMessage } = chat;
  const resetNotebookSync = sync.resetNotebookSync;

  const [dismissedError, setDismissedError] = useState<Error | null>(null);
  const liveError = rawError && rawError !== dismissedError ? rawError : null;
  const creditsExhausted =
    liveError !== null && isQuotaExceededCreditsError(liveError);
  const chatError = creditsExhausted ? null : liveError;

  const resetChat = useCallback(() => {
    setMessages([]);
    setActiveNotebookId(undefined);
    resetNotebookSync();
    useCourseBuilderStore.getState().reset();
    setDismissedError(rawError ?? null);
    router.push(
      new URL(routes.app.profile.org(orgSlug).notebook.root).pathname,
    );
  }, [setMessages, orgSlug, router, resetNotebookSync, rawError]);

  const retry = useCallback(
    (prompt: string) => {
      clearError();
      void sendMessage({ text: prompt });
    },
    [clearError, sendMessage],
  );

  const acknowledgeCreditsExhausted = useCallback(
    () => setDismissedError(rawError ?? null),
    [rawError],
  );
  const contextValue = useProviderContext({
    runtime,
    model,
    activeNotebookId,
    orgSlug,
    chatError,
    creditsExhausted,
    resetChat,
    retry,
    acknowledgeCreditsExhausted,
  });

  return (
    <NotebookContext.Provider value={contextValue}>
      {children}
    </NotebookContext.Provider>
  );
}
