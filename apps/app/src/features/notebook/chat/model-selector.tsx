"use client";

import type { NotebookTranslations } from "../i18n/notebook.types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

export type ModelSelectorOption = {
  id: string;
  label: string;
  description?: string | null;
  groupLabel: string;
};

interface ModelSelectorProps {
  t: NotebookTranslations;
  selectedModelId: string;
  options: readonly ModelSelectorOption[];
  onSelectModel: (modelId: string) => void;
}

export const ModelOption = ({
  model,
  selectedModelId,
  onSelect,
}: {
  model: ModelSelectorOption;
  selectedModelId: string;
  onSelect: (id: string) => void;
}) => {
  return (
    <DropdownMenuItem
      className="flex items-start gap-3 rounded-lg px-3 py-2 whitespace-normal"
      onClick={() => onSelect(model.id)}
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {model.id === selectedModelId ? (
          <Check className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
          {model.label}
        </span>
        <p className="text-[12px] leading-snug whitespace-normal text-neutral-500">
          {model.description}
        </p>
      </div>
    </DropdownMenuItem>
  );
};

export function ModelSelector({
  t,
  selectedModelId,
  options,
  onSelectModel,
}: ModelSelectorProps) {
  const [primaryModel, ...customModels] = options;
  const hasCustomModels = customModels.length > 0;

  const triggerLabel =
    options.find((model) => model.id === selectedModelId)?.label ??
    primaryModel?.label ??
    t.chat.selectModel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          type="button"
        >
          {triggerLabel}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-72 overflow-y-auto rounded-xl p-1.5"
        sideOffset={8}
      >
        {primaryModel ? (
          <>
            <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              {primaryModel.groupLabel}
            </div>
            <ModelOption
              model={primaryModel}
              selectedModelId={selectedModelId}
              onSelect={onSelectModel}
            />
          </>
        ) : null}

        <DropdownMenuSeparator className="my-1" />
        <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
          {t.chat.customModelsLabel}
        </div>
        {hasCustomModels ? (
          customModels.map((model) => (
            <ModelOption
              key={model.id}
              model={model}
              selectedModelId={selectedModelId}
              onSelect={onSelectModel}
            />
          ))
        ) : (
          <p className="px-3 py-2 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t.chat.noCustomModelsHint}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
