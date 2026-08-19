"use client";

import type { WorkspaceLayoutCompositionProps } from "./workspace-layout.types";

import { cn } from "@scibly/ui/utils";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { getChatErrorToastMessage } from "@/shared/ai/errors";

import { ChatInput } from "../../chat/chat-input";
import { MessageList } from "../../chat/message-list";
import {
  applyChatSendAction,
  getPendingChatInteraction,
} from "../../chat/message-list/shared/pending-chat-interaction";
import { QuickPrompts } from "../../chat/quick-prompts";
import {
  useNotebookActions,
  useNotebookMeta,
  useNotebookState,
} from "../../chat/runtime/context";
import { SourcesProcessingNotice } from "../../sources/sources-processing-notice";
import { useComposerPrefill } from "../hooks/use-composer-prefill";
import { ComposerTimeline } from "./composer-timeline";
import { OutOfCreditsDialog } from "./out-of-credits-dialog";

interface WorkspaceComposerProps {
  greeting: WorkspaceLayoutCompositionProps["greeting"];
  t: WorkspaceLayoutCompositionProps["t"];
  modelOptions: WorkspaceLayoutCompositionProps["modelOptions"];
  showcase?: {
    initialPromptValue: string;
    promptOptions: ReadonlyArray<{ label: string; prompt: string }>;
  };
}

type PendingInteraction = ReturnType<typeof getPendingChatInteraction>;

function chatPlaceholder(
  t: WorkspaceComposerProps["t"],
  pending: PendingInteraction,
  isImageGenerationInFlight: boolean,
  isShowcase: boolean,
) {
  if (isShowcase) return t.chat.chipsOnlyPlaceholder;
  if (isImageGenerationInFlight) {
    return t.chat.imageGeneration.pendingApprovalPlaceholder;
  }
  if (pending.multipleChoice) {
    return t.chat.multipleChoice.replyDirectlyPlaceholder;
  }
  return undefined;
}

interface ComposerControlsProps extends Omit<
  WorkspaceComposerProps,
  "greeting"
> {
  hasMessages: boolean;
  isLoading: boolean;
  isImageGenerationInFlight: boolean;
  pendingInteraction: PendingInteraction;
  promptPrefill: string;
  chatInputKey: number;
  currentModelId: string;
  showInitialView: boolean;
  chatError: Error | null;
  onRetry?: () => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onSelectModel: (modelId: string) => void;
  onSelectPrompt: (prompt: string) => void;
}

export const ComposerControls = (props: ComposerControlsProps) => {
  const { notebookId } = useNotebookMeta();
  const {
    t,
    showcase,
    hasMessages,
    isLoading,
    isImageGenerationInFlight,
    pendingInteraction,
    promptPrefill,
    chatInputKey,
    currentModelId,
    modelOptions,
    showInitialView,
    chatError,
    onRetry,
    onSend,
    onStop,
    onSelectModel,
    onSelectPrompt,
  } = props;
  const composerPrefill = useComposerPrefill();
  const inputKey = showcase
    ? `${hasMessages ? "sent" : "initial"}-${chatInputKey}-${composerPrefill.nonce}`
    : chatInputKey;
  return (
    <div className="w-full space-y-3">
      {chatError ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-2.5 text-[13px] text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
        >
          <p className="min-w-0 flex-1">
            <span className="font-medium">{t.chat.error}</span>{" "}
            {getChatErrorToastMessage(chatError, t.chat.errorFallback)}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded-lg border border-red-300/80 px-2.5 py-1 font-medium transition-colors hover:bg-red-100/80 dark:border-red-900/60 dark:hover:bg-red-950/40"
            >
              {t.chat.errorRetry}
            </button>
          ) : null}
        </div>
      ) : null}
      {showcase ? null : (
        <SourcesProcessingNotice notebookId={notebookId} t={t} />
      )}
      <ChatInput
        key={inputKey}
        disabled={isImageGenerationInFlight}
        isGenerating={isLoading}
        onStop={showcase ? undefined : onStop}
        onSend={onSend}
        t={t}
        modelOptions={modelOptions}
        selectedModelId={currentModelId}
        onSelectModel={onSelectModel}
        defaultValue={
          showcase
            ? (composerPrefill.text ?? (hasMessages ? "" : promptPrefill))
            : promptPrefill
        }
        elevated={showInitialView}
        readOnly={Boolean(showcase)}
        placeholder={chatPlaceholder(
          t,
          pendingInteraction,
          isImageGenerationInFlight,
          Boolean(showcase),
        )}
      />
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          showInitialView
            ? "max-h-40 opacity-100"
            : "pointer-events-none max-h-0 opacity-0",
        )}
      >
        <QuickPrompts
          t={t}
          prompts={showcase?.promptOptions}
          disabled={isLoading || isImageGenerationInFlight}
          onSelect={onSelectPrompt}
        />
      </div>
    </div>
  );
};

export function WorkspaceComposer({
  greeting,
  t,
  modelOptions,
  showcase,
}: WorkspaceComposerProps) {
  const [promptPrefill, setPromptPrefill] = useState(
    () => showcase?.initialPromptValue ?? "",
  );
  const [chatInputKey, setChatInputKey] = useState(0);
  const {
    messages,
    chatError,
    creditsExhausted,
    isLoading,
    isCompacting,
    isNotebookHistoryLoading,
  } = useNotebookState();
  const {
    setCurrentModelId,
    sendMessage,
    stop,
    retry,
    acknowledgeCreditsExhausted,
  } = useNotebookActions();
  const { notebookId, currentModelId, orgSlug } = useNotebookMeta();
  const hasMessages = messages.length > 0;
  const showInitialView = !hasMessages && !isNotebookHistoryLoading;
  const pendingInteraction = useMemo(
    () => getPendingChatInteraction(messages),
    [messages],
  );
  const isImageGenerationInFlight = Boolean(pendingInteraction.imageGeneration);

  const handleRetryMessage = useCallback(
    (text: string) => void sendMessage({ text }),
    [sendMessage],
  );

  const handleSendMessage = (text: string) =>
    applyChatSendAction(
      {
        text,
        pending: pendingInteraction,
        messages: {
          deletionPendingApproval: t.chat.deletion.pendingApproval,
          planPendingApproval: t.chat.planning.pendingApproval,
          multipleChoicePendingApproval: t.chat.multipleChoice.pendingApproval,
          imageGenerationPendingApproval:
            t.chat.imageGeneration.pendingApproval,
        },
      },
      {
        sendMessage: (input) => void sendMessage(input),
        notify: (message) => void toast.message(message),

        onSubmitted: () => useComposerPrefill.getState().clear(),
      },
    );

  return (
    <>
      {showcase ? null : (
        <OutOfCreditsDialog
          open={creditsExhausted}
          orgSlug={orgSlug}
          onAcknowledge={acknowledgeCreditsExhausted}
          t={t}
        />
      )}
      <ComposerTimeline
        greeting={greeting}
        initial={showInitialView}
        messages={
          <MessageList
            messages={messages}
            isChatLoading={isLoading}
            isCompacting={isCompacting}
            hasChats={hasMessages}
            notebookId={notebookId}
            onRetryMessage={handleRetryMessage}
            t={t}
          />
        }
        controls={
          <ComposerControls
            t={t}
            modelOptions={modelOptions}
            showcase={showcase}
            hasMessages={hasMessages}
            isLoading={isLoading}
            isImageGenerationInFlight={isImageGenerationInFlight}
            pendingInteraction={pendingInteraction}
            promptPrefill={promptPrefill}
            chatInputKey={chatInputKey}
            currentModelId={currentModelId}
            showInitialView={showInitialView}
            chatError={chatError}
            onRetry={
              showcase ? undefined : () => retry(t.chat.errorRetryPrompt)
            }
            onSend={handleSendMessage}
            onStop={stop}
            onSelectModel={setCurrentModelId}
            onSelectPrompt={(prompt) => {
              setPromptPrefill(prompt);
              setChatInputKey((key) => key + 1);
            }}
          />
        }
      />
    </>
  );
}
