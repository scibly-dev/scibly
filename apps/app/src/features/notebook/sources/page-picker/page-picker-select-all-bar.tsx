"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { Check } from "lucide-react";

type T = NotebookTranslations["sources"]["pagePicker"];
type PageItem = RouterOutputs["integration"]["searchPages"]["pages"][number];

interface PagePickerSelectAllBarProps {
  selectablePages: PageItem[];
  selected: Set<string>;
  totalSourceCount: number;

  // Not the plan's source limit: the highest total this picker can actually
  // reach, which is the lower of the plan's room and one request's page cap.
  maxTotal: number;
  allVisibleSelected: boolean;
  t: T;
  onToggleSelectAll: () => void;
}

export function PagePickerSelectAllBar({
  selectablePages,
  selected,
  totalSourceCount,
  maxTotal,
  allVisibleSelected,
  t,
  onToggleSelectAll,
}: PagePickerSelectAllBarProps) {
  const projectedTotal = totalSourceCount + selected.size;

  return (
    <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-2 dark:border-neutral-800/60">
      <button
        type="button"
        onClick={onToggleSelectAll}
        className="flex items-center gap-2 text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        <span
          className={cn(
            "flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors",
            allVisibleSelected
              ? "border-neutral-800 bg-neutral-800 dark:border-neutral-200 dark:bg-neutral-200"
              : "border-neutral-300 dark:border-neutral-600",
          )}
          aria-hidden
        >
          {allVisibleSelected && (
            <Check className="h-2 w-2 text-white dark:text-neutral-900" />
          )}
        </span>
        {allVisibleSelected
          ? t.deselectAll.replace("{count}", String(selectablePages.length))
          : t.selectAll.replace("{count}", String(selectablePages.length))}
      </button>

      <span
        className={cn(
          "text-[10px] font-medium tabular-nums",
          projectedTotal >= maxTotal
            ? "text-amber-600 dark:text-amber-400"
            : "text-neutral-400",
        )}
      >
        {t.pagesSelected
          .replace("{count}", String(projectedTotal))
          .replace("{max}", String(maxTotal))}
      </span>
    </div>
  );
}
