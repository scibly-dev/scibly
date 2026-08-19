"use client";

import type { NotebookTranslations } from "../i18n/notebook.types";

import { chipRestClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { BookOpen, ClipboardList, Layers, Target } from "lucide-react";
import { createElement } from "react";

const PROMPT_CONFIG = [
  {
    icon: BookOpen,
    accent: "bg-[#eff5ff] text-[#0b52cc] dark:bg-sky-950/40 dark:text-sky-400",
  },
  {
    icon: Target,
    accent:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  {
    icon: ClipboardList,
    accent:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  },
  {
    icon: Layers,
    accent:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
] as const;

interface QuickPromptsProps {
  t: NotebookTranslations;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  prompts?: ReadonlyArray<{ label: string; prompt: string }>;
}

export function QuickPrompts({
  t,
  onSelect,
  disabled,
  prompts: promptsProp,
}: QuickPromptsProps) {
  const prompts = promptsProp ?? t.page.quickPrompts;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 pb-1.5">
      {prompts.map(({ label, prompt }, index) => {
        const { icon: promptIcon, accent } =
          PROMPT_CONFIG[index % PROMPT_CONFIG.length];
        return (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt)}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-2 text-[13px] font-semibold",
              chipRestClass,

              "border-edge hover:border-[#b9d7ff]",
              "ease-press transition-[translate,box-shadow,border-color,color] duration-100 active:translate-y-[3px] active:shadow-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 dark:shadow-none dark:hover:border-neutral-700 dark:hover:bg-neutral-900",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                accent,
              )}
            >
              {createElement(promptIcon, {
                className: "h-3.5 w-3.5 stroke-[1.75]",
              })}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
