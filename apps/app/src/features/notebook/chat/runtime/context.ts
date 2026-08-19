"use client";

import type { Chat } from "@ai-sdk/react";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { ImageGenerationInvocation } from "../../media/generated-image/tool-part";

import { type useChat } from "@ai-sdk/react";
import { createContext, use } from "react";

type UseChatReturn = ReturnType<typeof useChat<NotebookMessage>>;

type NotebookActions = {
  sendMessage: UseChatReturn["sendMessage"];
  stop: UseChatReturn["stop"];
  resetChat: () => void;

  retry: (prompt: string) => void;
  addToolOutput: (
    params: Parameters<Chat<NotebookMessage>["addToolOutput"]>[0],
  ) => void;
  addToolApprovalResponse: (
    params: Parameters<Chat<NotebookMessage>["addToolApprovalResponse"]>[0],
  ) => void | PromiseLike<void>;
  updateTitle: (title: string) => void;
  ensureNotebook: () => Promise<string>;
  setCurrentModelId: (id: string) => void;
  acknowledgeCreditsExhausted: () => void;
};

export type NotebookState = {
  messages: UseChatReturn["messages"];
  setMessages: UseChatReturn["setMessages"];
  status: UseChatReturn["status"];
  isLoading: boolean;

  isCompacting: boolean;
  chatError: Error | null;

  creditsExhausted: boolean;
  isNotebookHistoryLoading: boolean;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  loadOlderMessages: () => Promise<void>;
  imageInvocations: ImageGenerationInvocation[];
};

type NotebookMeta = {
  notebookId: string | undefined;
  orgSlug: string;
  notebookTitle: string | undefined;
  currentModelId: string;
};

export type NotebookContextValue = {
  state: NotebookState;
  actions: NotebookActions;
  meta: NotebookMeta;
};

export const NotebookContext = createContext<NotebookContextValue | null>(null);

function useNotebook(): NotebookContextValue {
  const context = use(NotebookContext);
  if (!context) {
    throw new Error("useNotebook must be used within <NotebookProvider>");
  }
  return context;
}

export function useNotebookActions(): NotebookActions {
  return useNotebook().actions;
}

export function useNotebookState(): NotebookState {
  return useNotebook().state;
}

export function useNotebookMeta(): NotebookMeta {
  return useNotebook().meta;
}

export function useNotebookImageInvocations(): ImageGenerationInvocation[] {
  return useNotebook().state.imageInvocations;
}
