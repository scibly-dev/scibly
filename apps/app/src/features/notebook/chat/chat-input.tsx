"use client";

import type { NotebookTranslations } from "../i18n/notebook.types";
import type { ModelSelectorOption } from "./model-selector";

import { AutosizeTextarea } from "@scibly/ui/components/autosize-textarea";
import { cn } from "@scibly/ui/utils";
import { ArrowUp, Square } from "lucide-react";
import { useCallback, useState } from "react";

import {
  notebookBorder,
  notebookPrimaryButton,
} from "../workspace/components/notebook-shell";
import { ModelSelector } from "./model-selector";

interface ChatInputProps {
  disabled?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
  onSend: (message: string) => void;
  t: NotebookTranslations;
  modelOptions: readonly ModelSelectorOption[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;

  defaultValue?: string;

  elevated?: boolean;
  placeholder?: string;

  readOnly?: boolean;
}

export const ChatInputFooter = ({
  props,
  canSend,
  onSend,
}: {
  props: ChatInputProps;
  canSend: boolean;
  onSend: () => void;
}) => {
  return (
    <div className="flex items-center justify-between px-3 pb-3">
      <div className="min-w-0 flex-1">
        <ModelSelector
          t={props.t}
          selectedModelId={props.selectedModelId}
          options={props.modelOptions}
          onSelectModel={props.onSelectModel}
        />
      </div>
      {props.isGenerating ? (
        <button
          aria-label={props.t.chat.stopButton}
          aria-disabled={!props.onStop}
          className="bg-ink ease-press flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white shadow-[0_3px_0_0_#0a1030] transition-[translate,box-shadow,background-color] duration-100 enabled:hover:bg-[#263061] enabled:active:translate-y-[3px] enabled:active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 dark:bg-neutral-100 dark:text-neutral-900 dark:shadow-none dark:enabled:hover:bg-neutral-200"
          disabled={!props.onStop}
          onClick={props.onStop}
          type="button"
        >
          <Square className="h-3 w-3 fill-current" />
        </button>
      ) : (
        <button
          aria-label={props.t.chat.sendButton}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
            canSend
              ? cn("scale-100", notebookPrimaryButton)
              : "bg-ground text-ink-faint scale-95 transition-transform duration-300 dark:bg-neutral-800 dark:text-neutral-600",
          )}
          disabled={!canSend}
          onClick={onSend}
          type="button"
        >
          <ArrowUp className="h-4 w-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

export const ChatTextarea = ({
  value,
  props,
  onChange,
  onKeyDown,
}: {
  value: string;
  props: ChatInputProps;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}) => {
  return (
    <div className="px-5 pt-4 pb-2">
      <AutosizeTextarea
        className="text-foreground min-h-[28px] w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
        onChange={(event) => {
          if (!props.readOnly) onChange(event.target.value);
        }}
        onKeyDown={onKeyDown}
        placeholder={props.placeholder ?? props.t.chat.inputPlaceholder}
        readOnly={props.readOnly}
        value={value}
      />
    </div>
  );
};

function useChatInputState(props: ChatInputProps) {
  const [input, setInput] = useState(props.defaultValue ?? "");
  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || props.disabled || props.isGenerating) return;
    setInput("");
    props.onSend(trimmed);
  }, [input, props]);
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (props.readOnly) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    },
    [send, props.readOnly],
  );
  return {
    input,
    setInput,
    send,
    handleKeyDown,
    canSend: input.trim().length > 0 && !props.disabled && !props.isGenerating,
  };
}

export function ChatInput({
  disabled = false,
  isGenerating = false,
  onStop,
  onSend,
  t,
  modelOptions,
  selectedModelId,
  onSelectModel,
  defaultValue = "",
  elevated = false,
  placeholder,
  readOnly = false,
}: ChatInputProps) {
  const props = {
    disabled,
    isGenerating,
    onStop,
    onSend,
    t,
    modelOptions,
    selectedModelId,
    onSelectModel,
    defaultValue,
    elevated,
    placeholder,
    readOnly,
  };
  const state = useChatInputState(props);

  return (
    <div
      className={cn(
        "w-full rounded-[24px] border-2 bg-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        notebookBorder,
        "focus-within:border-edge shadow-[0_3px_0_0_var(--color-lip)] focus-within:shadow-[0_3px_0_0_var(--color-edge)]",
        "dark:bg-neutral-950 dark:shadow-none dark:focus-within:border-neutral-700",
        elevated &&
          "shadow-[0_4px_0_0_var(--color-edge)] focus-within:shadow-[0_4px_0_0_#c9d4ec]",
      )}
    >
      <ChatTextarea
        value={state.input}
        props={props}
        onChange={state.setInput}
        onKeyDown={state.handleKeyDown}
      />

      <ChatInputFooter
        props={props}
        canSend={state.canSend}
        onSend={state.send}
      />
    </div>
  );
}
