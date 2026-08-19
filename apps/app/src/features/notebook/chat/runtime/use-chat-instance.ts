"use client";

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { RefObject } from "react";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { useChat } from "@ai-sdk/react";
import { usePostHog } from "@scibly/observability/client";
import { type ChatOnToolCallCallback } from "ai";
import { useMemo, useRef, useState } from "react";

import { shouldSendChatAutomatically } from "@/features/notebook/chat/tools/approval-tools";
import { api } from "@/shared/api/trpc/client";

import { syncNotebookUrl } from "../../course-builder/hooks/url-sync";
import { useCourseStreamListener } from "../../course-builder/hooks/use-course-stream-listener";
import { createNotebookTransport } from "./notebook-transport";
import { useChatDataParts } from "./use-chat-data-parts";
import { useEditorClientTools } from "./use-editor-client-tools";

type WebsocketProvider =
  HocuspocusProvider["configuration"]["websocketProvider"];

interface UseChatInstanceParams {
  orgSlugRef: RefObject<string>;
  activeNotebookIdRef: RefObject<string | undefined>;
  currentModelIdRef: RefObject<string>;
  websocketProviderRef: RefObject<WebsocketProvider | null | undefined>;
  setActiveNotebookId: (id: string | undefined) => void;
}

function useNotebookTransport(
  {
    orgSlugRef,
    activeNotebookIdRef,
    currentModelIdRef,
    setActiveNotebookId,
  }: Pick<
    UseChatInstanceParams,
    | "orgSlugRef"
    | "activeNotebookIdRef"
    | "currentModelIdRef"
    | "setActiveNotebookId"
  >,
  utils: ReturnType<typeof api.useUtils>,
) {
  return useMemo(
    () =>
      createNotebookTransport(
        { orgSlugRef, activeNotebookIdRef, currentModelIdRef },
        {
          setActiveNotebookId,
          onNotebookCreated: ({ orgSlug, notebookId }) => {
            syncNotebookUrl(orgSlug, notebookId);
            void utils.notebook.getById.invalidate({ orgSlug, notebookId });
            void utils.notebook.list.invalidate({ orgSlug });
          },
        },
      ),
    [
      orgSlugRef,
      activeNotebookIdRef,
      currentModelIdRef,
      setActiveNotebookId,
      utils,
    ],
  );
}

export function useChatInstance({
  orgSlugRef,
  activeNotebookIdRef,
  currentModelIdRef,
  websocketProviderRef,
  setActiveNotebookId,
}: UseChatInstanceParams) {
  const utils = api.useUtils();
  const posthog = usePostHog();
  const handleCourseDelta = useCourseStreamListener();
  const [isCompacting, setIsCompacting] = useState(false);

  const transport = useNotebookTransport(
    {
      orgSlugRef,
      activeNotebookIdRef,
      currentModelIdRef,
      setActiveNotebookId,
    },
    utils,
  );

  const handleDataPart = useChatDataParts({
    orgSlugRef,
    activeNotebookIdRef,
    utils,
    onCourseDelta: handleCourseDelta,
    onCompaction: (status) => setIsCompacting(status === "summarizing"),
  });

  const onToolCallRef = useRef<ChatOnToolCallCallback<NotebookMessage>>(
    () => undefined,
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    addToolOutput,
    addToolApprovalResponse,
    clearError,
  } = useChat<NotebookMessage>({
    throttle: 50,
    sendAutomaticallyWhen: shouldSendChatAutomatically,
    transport,
    onToolCall: (params) => onToolCallRef.current(params),

    onFinish: () => {
      setIsCompacting(false);
      posthog.capture("ai_response_completed", {
        orgSlug: orgSlugRef.current,
        modelId: currentModelIdRef.current,
      });
      void utils.billing.getGenerationBalance.invalidate({
        orgSlug: orgSlugRef.current,
      });
    },
    onError: (err: Error) => {
      console.error("[NotebookProvider] Stream error:", err);

      setIsCompacting(false);

      posthog.capture("ai_response_failed", {
        orgSlug: orgSlugRef.current,
        modelId: currentModelIdRef.current,
      });

      void utils.billing.getGenerationBalance.invalidate({
        orgSlug: orgSlugRef.current,
      });
    },
    onData: handleDataPart,
  });

  useEditorClientTools({
    activeNotebookIdRef,
    websocketProviderRef,
    utils,
    addToolOutput,
    onToolCallRef,
  });

  return {
    messages,
    sendMessage,
    setMessages,
    status,
    isCompacting,
    stop,
    error,
    addToolOutput,
    addToolApprovalResponse,
    clearError,
  };
}
