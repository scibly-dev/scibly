"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { InfographicImageComment } from "./infographic-comments";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { Plus, X } from "lucide-react";

interface InfographicCommentsPanelProps {
  comments: InfographicImageComment[];
  additionalNotes: string;
  labels: NotebookTranslations["studio"]["imageEditor"]["comments"];
  disabled?: boolean;
  onAdditionalNotesChange: (value: string) => void;
  onClearAll: () => void;
  onSend: () => void;
}

export function InfographicCommentsPanel({
  comments,
  additionalNotes,
  labels,
  disabled = false,
  onAdditionalNotesChange,
  onClearAll,
  onSend,
}: InfographicCommentsPanelProps) {
  const filledCount = comments.filter((comment) => comment.text.trim()).length;
  const canSend =
    (filledCount > 0 || Boolean(additionalNotes.trim())) && !disabled;

  const countLabel =
    comments.length === 1
      ? labels.countSingular.replace("{count}", "1")
      : labels.countPlural.replace("{count}", String(comments.length));

  return (
    <div className="border-hairline overflow-hidden rounded-[20px] border-2 bg-white shadow-[0_4px_0_0_var(--color-lip)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
      <div className="border-hairline flex items-center justify-between gap-2 border-b-2 px-3 py-2.5 dark:border-neutral-800/80">
        <div className="text-ink flex min-w-0 items-center gap-2 text-[13px] font-semibold dark:text-neutral-100">
          <Plus className="text-ink-faint h-4 w-4 shrink-0" />
          <span className="truncate">{countLabel}</span>
        </div>
        <button
          type="button"
          aria-label={labels.clearAll}
          className="text-ink-faint hover:bg-ground hover:text-ink flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] transition-colors outline-none focus:outline-none focus-visible:outline-none dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
          onClick={onClearAll}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5">
        <Plus className="text-ink-faint h-4 w-4 shrink-0 dark:text-neutral-600" />
        <input
          value={additionalNotes}
          disabled={disabled}
          placeholder={labels.additionalPlaceholder}
          className={cn(
            "text-ink min-w-0 flex-1 bg-transparent text-[13px] outline-none",
            "placeholder:text-ink-faint disabled:opacity-50",
            "dark:text-neutral-100 dark:placeholder:text-neutral-500",
          )}
          onChange={(event) =>
            onAdditionalNotesChange(event.currentTarget.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
        />
        <Button
          type="button"
          disabled={!canSend}
          onClick={onSend}
          className="h-8 shrink-0 rounded-[10px] px-4 text-[13px]"
        >
          {labels.send}
        </Button>
      </div>
    </div>
  );
}
