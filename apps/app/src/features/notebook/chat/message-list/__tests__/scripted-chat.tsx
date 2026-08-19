import type { ReactNode } from "react";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type { NotebookContextValue } from "../../runtime/context";

import { useChat } from "@ai-sdk/react";
import { createChat } from "@shadcn/helpers/ai-sdk";
import { render } from "@testing-library/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useEffect, useMemo } from "react";

import { shouldSendAfterApprovalResponses } from "@/features/notebook/chat/tools/approval-tools";
import dictionary from "@/i18n/generated/dictionary.en.json";

import { getImageGenerationInvocations } from "../../../media/generated-image/tool-part";
import {
  NotebookContext,
  useNotebookActions,
  useNotebookState,
} from "../../runtime/context";
import { AssistantMessageParts } from "../components/assistant-message-parts";

export const notebookTranslations: NotebookTranslations = dictionary.notebook;

/**
 * A conversation the transport replays chunk by chunk: the states these suites
 * guard live for a few frames mid-stream, not in a finished `parts` array.
 */
export function scriptChat(messages?: NotebookMessage[]) {
  return createChat<NotebookMessage>({ messages });
}

export type ScriptedChat = ReturnType<typeof scriptChat>;

type ToolOutputObserver = (
  args: Parameters<NotebookContextValue["actions"]["addToolOutput"]>[0],
) => void;

// The notebook context over a real `useChat` — everything the cards read is the shipped machinery, only the network is scripted; the provider's tRPC and collaboration plumbing are left out since no card touches them.
export function ScriptedNotebookProvider({
  chat,
  children,
  delayMs,
  onToolOutput,
}: {
  chat: ScriptedChat;
  children: ReactNode;
  delayMs?: number;
  onToolOutput?: ToolOutputObserver;
}) {
  const transport = useMemo(() => chat.transport({ delayMs }), [chat, delayMs]);
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
    transport,
    sendAutomaticallyWhen: (params) =>
      shouldSendAfterApprovalResponses(params) ||
      lastAssistantMessageIsCompleteWithToolCalls(params),
  });

  const value = useMemo<NotebookContextValue>(
    () => ({
      state: {
        messages,
        setMessages,
        status,
        isLoading: status === "submitted" || status === "streaming",
        isCompacting: false,
        chatError: error ?? null,
        creditsExhausted: false,
        isNotebookHistoryLoading: false,
        hasOlderMessages: false,
        isLoadingOlderMessages: false,
        loadOlderMessages: async () => {},
        imageInvocations: getImageGenerationInvocations(messages),
      },
      actions: {
        sendMessage,
        stop,
        resetChat: () => setMessages([]),
        retry: (prompt) => {
          clearError();
          void sendMessage({ text: prompt });
        },
        addToolOutput: (args) => {
          onToolOutput?.(args);
          return addToolOutput(args);
        },
        addToolApprovalResponse,
        updateTitle: () => {},
        ensureNotebook: () => Promise.resolve("notebook-1"),
        setCurrentModelId: () => {},
        acknowledgeCreditsExhausted: () => {},
      },
      meta: {
        notebookId: "notebook-1",
        orgSlug: "acme",
        notebookTitle: "Scripted notebook",
        currentModelId: "test-model",
      },
    }),
    [
      addToolApprovalResponse,
      addToolOutput,
      clearError,
      onToolOutput,
      error,
      messages,
      sendMessage,
      setMessages,
      status,
      stop,
    ],
  );

  return <NotebookContext value={value}>{children}</NotebookContext>;
}

export function ScriptedTranscript() {
  const { messages, isLoading } = useNotebookState();
  const assistantTurns = messages.filter(
    (message) => message.role === "assistant",
  );
  const newestId = assistantTurns.at(-1)?.id;

  return (
    <>
      {assistantTurns.map((message) => (
        <AssistantMessageParts
          key={message.id}
          message={message}
          t={notebookTranslations}
          isChatLoading={isLoading}
          isNewestTurn={message.id === newestId}
          canCopy={false}
        />
      ))}
    </>
  );
}

type NotebookActions = ReturnType<typeof useNotebookActions>;
type NotebookState = ReturnType<typeof useNotebookState>;

function CaptureRuntime({
  actions: actionsRef,
  state: stateRef,
}: {
  actions: { current: NotebookActions };
  state: { current: NotebookState };
}) {
  const actions = useNotebookActions();
  const state = useNotebookState();
  useEffect(() => {
    actionsRef.current = actions;
    stateRef.current = state;
  });
  return null;
}

/**
 * `actions` is the same handle the composer holds, so a test drives the turn
 * the way the author would.
 */
export function renderScripted(
  chat: ScriptedChat,
  options: {
    children?: ReactNode;
    delayMs?: number;
    onToolOutput?: ToolOutputObserver;
  } = {},
) {
  const actions = { current: null as unknown as NotebookActions };
  const state = { current: null as unknown as NotebookState };
  const view = render(
    <ScriptedNotebookProvider
      chat={chat}
      delayMs={options.delayMs}
      onToolOutput={options.onToolOutput}
    >
      <CaptureRuntime actions={actions} state={state} />
      {/* `null` means "no UI": a suite about the transcript alone must not
          mount cards that register themselves with the composer. */}
      {options.children === undefined ? (
        <ScriptedTranscript />
      ) : (
        options.children
      )}
    </ScriptedNotebookProvider>,
  );
  return { ...view, actions, state };
}

/**
 * The scripted transport emits a tool call as one `tool-input-available` chunk,
 * so `input-streaming` — the state the skeleton exists for — can only be staged
 * from hand-built parts.
 */
export function renderTurn(parts: NotebookMessage["parts"]) {
  return renderScripted(scriptChat(), {
    children: (
      <AssistantMessageParts
        message={{ id: "assistant-1", role: "assistant", parts }}
        t={notebookTranslations}
        isChatLoading
        isNewestTurn
        canCopy={false}
      />
    ),
  });
}
