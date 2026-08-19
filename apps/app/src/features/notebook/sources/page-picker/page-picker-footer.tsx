"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { DialogFooter } from "@scibly/ui/components/dialog";

type T = NotebookTranslations["sources"]["pagePicker"];
type PageItem = RouterOutputs["integration"]["searchPages"]["pages"][number];

interface PagePickerFooterProps {
  pages: PageItem[];
  selected: Set<string>;
  isLoading: boolean;
  isPending: boolean;
  t: T;
  onClearSelection: () => void;
  onCancel: () => void;
  onAdd: () => void;
}

export function PagePickerFooter({
  pages,
  selected,
  isLoading,
  isPending,
  t,
  onClearSelection,
  onCancel,
  onAdd,
}: PagePickerFooterProps) {
  return (
    <DialogFooter className="shrink-0 border-t border-neutral-100 px-5 py-4 dark:border-neutral-800/60">
      <div className="flex w-full items-center justify-between gap-3">
        {/* Left: page count */}
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] text-neutral-400 tabular-nums">
            {pages.length > 0
              ? t.pagesVisible.replace("{count}", String(pages.length))
              : isLoading
                ? ""
                : "–"}
          </p>
          {pages.length > 0 && (
            <button
              type="button"
              title={t.pagesVisibleNote}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-neutral-300 text-[8px] font-bold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-600 dark:border-neutral-600 dark:hover:border-neutral-400"
              aria-label={t.pagesVisibleInfo}
            >
              i
            </button>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              {t.clear}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={selected.size === 0 || isPending}
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-1.5 text-[12px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900" />
                {t.adding}
              </span>
            ) : (
              t.addSelected.replace("{count}", String(selected.size))
            )}
          </button>
        </div>
      </div>
    </DialogFooter>
  );
}
