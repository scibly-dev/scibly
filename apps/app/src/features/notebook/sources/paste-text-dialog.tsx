"use client";

import type { NotebookTranslations } from "../i18n/notebook.types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { cn } from "@scibly/ui/utils";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { MAX_WORDS_PER_SOURCE } from "@/shared/content/sources/constants";
import { countWords } from "@/shared/content/sources/word-count";

interface PasteTextDialogProps {
  t: NotebookTranslations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, content: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const PasteTextFields = ({
  t,
  name,
  content,
  disabled,
  wordCount,
  overWordLimit,
  setName,
  setContent,
}: {
  t: NotebookTranslations;
  name: string;
  content: string;
  disabled: boolean;
  wordCount: number;
  overWordLimit: boolean;
  setName: (value: string) => void;
  setContent: (value: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-4 py-2">
      <input
        type="text"
        placeholder={t.sources.pasteDialog.namePlaceholder}
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 outline-none focus:border-neutral-300 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:placeholder-neutral-600 dark:focus:border-neutral-700"
      />
      <textarea
        placeholder={t.sources.pasteDialog.contentPlaceholder}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={8}
        disabled={disabled}
        className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 placeholder-neutral-400 outline-none focus:border-neutral-300 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:placeholder-neutral-600 dark:focus:border-neutral-700"
      />
      <span
        className={cn(
          "text-[10px] tabular-nums",
          overWordLimit
            ? "text-red-600 dark:text-red-400"
            : "text-neutral-400 dark:text-neutral-500",
        )}
      >
        {t.sources.pasteDialog.wordCount
          .replace("{count}", wordCount.toLocaleString())
          .replace("{max}", MAX_WORDS_PER_SOURCE.toLocaleString())}
      </span>
      {overWordLimit ? (
        <span className="text-[10px] text-red-600 dark:text-red-400">
          {t.sources.pasteDialog.wordLimitExceeded}
        </span>
      ) : null}
    </div>
  );
};

export function PasteTextDialog({
  t,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  disabled = false,
}: PasteTextDialogProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const wordCount = useMemo(() => countWords(content), [content]);
  const overWordLimit = wordCount > MAX_WORDS_PER_SOURCE;

  const handleSubmit = () => {
    if (!name.trim() || !content.trim() || disabled || overWordLimit) return;
    onSubmit(name.trim(), content.trim());
    setName("");
    setContent("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setContent("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.sources.pasteDialog.title}</DialogTitle>
        </DialogHeader>

        <PasteTextFields
          t={t}
          name={name}
          content={content}
          disabled={disabled}
          wordCount={wordCount}
          overWordLimit={overWordLimit}
          setName={setName}
          setContent={setContent}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleOpenChange(false)}
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {t.sources.pasteDialog.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              disabled ||
              !name.trim() ||
              !content.trim() ||
              isLoading ||
              overWordLimit
            }
            type="button"
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t.sources.pasteDialog.add}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
