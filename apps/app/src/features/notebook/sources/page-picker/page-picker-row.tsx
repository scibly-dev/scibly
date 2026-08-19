"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { Check, ChevronRight, Database, ExternalLink } from "lucide-react";

type T = NotebookTranslations["sources"]["pagePicker"];
type PageItem = RouterOutputs["integration"]["searchPages"]["pages"][number];

interface PagePickerRowProps {
  page: PageItem;
  isSelected: boolean;
  isAlreadyLinked: boolean;
  isDisabled: boolean;
  t: T;
  onToggle: (pageId: string) => void;
  onDrillInto: (page: PageItem) => void;
}

export const SelectionIndicator = ({
  page,
  isSelected,
  isAlreadyLinked,
}: Pick<PagePickerRowProps, "page" | "isSelected" | "isAlreadyLinked">) => {
  if (page.isDatabase) {
    return (
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center"
        aria-hidden
      >
        <Database className="h-3.5 w-3.5 text-neutral-400" />
      </span>
    );
  }
  if (isAlreadyLinked) {
    return (
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-neutral-300 bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-700"
        aria-label="Already linked"
        aria-hidden
      >
        <Check className="h-2.5 w-2.5 text-neutral-400 dark:text-neutral-500" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-100",
        isSelected
          ? "border-neutral-800 bg-neutral-800 dark:border-neutral-200 dark:bg-neutral-200"
          : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900",
      )}
      aria-hidden
    >
      {isSelected ? (
        <Check className="h-2.5 w-2.5 text-white dark:text-neutral-900" />
      ) : null}
    </span>
  );
};

export const PageSummary = ({ page }: { page: PageItem }) => {
  return (
    <>
      {page.icon && !page.isDatabase ? (
        <span className="shrink-0 text-sm leading-none" aria-hidden>
          {page.icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] leading-snug font-medium",
            page.isDatabase
              ? "text-neutral-500 dark:text-neutral-400"
              : "text-neutral-800 dark:text-neutral-100",
          )}
        >
          {page.title}
        </p>
        {page.lastEdited ? (
          <p className="mt-0.5 truncate text-[10px] text-neutral-400">
            {page.lastEdited.toLocaleDateString()}
          </p>
        ) : null}
      </div>
    </>
  );
};

export const PageActions = ({
  page,
  t,
  onDrillInto,
}: Pick<PagePickerRowProps, "page" | "t" | "onDrillInto">) => {
  const browseLabel = page.isDatabase ? t.browseDatabase : t.browseSubpages;
  return (
    <div className="flex shrink-0 items-center gap-0.5 pr-2">
      <a
        href={page.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        title={t.openInSourceLabel}
        className="rounded p-1.5 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-neutral-600 dark:hover:text-neutral-300"
        aria-label={t.openInSource.replace("{title}", page.title)}
      >
        <ExternalLink className="h-3 w-3" />
      </a>
      <button
        type="button"
        onClick={() => onDrillInto(page)}
        title={browseLabel}
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium transition-all",
          page.isDatabase
            ? "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            : "text-neutral-300 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
        )}
        aria-label={browseLabel}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export function PagePickerRow({
  page,
  isSelected,
  isAlreadyLinked,
  isDisabled,
  t,
  onToggle,
  onDrillInto,
}: PagePickerRowProps) {
  return (
    <li
      className={cn(
        "group flex items-center transition-all duration-100",
        isSelected
          ? "bg-neutral-50/80 dark:bg-neutral-800/30"
          : "hover:bg-neutral-50/60 dark:hover:bg-neutral-800/20",
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (!page.isDatabase && !isAlreadyLinked) onToggle(page.id);
        }}
        disabled={isDisabled || isAlreadyLinked}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 bg-transparent py-3 pr-2 pl-5 text-left transition-colors duration-100",
          isAlreadyLinked
            ? "cursor-default"
            : isDisabled
              ? "cursor-not-allowed opacity-40"
              : page.isDatabase
                ? "cursor-default"
                : "cursor-pointer",
        )}
      >
        <SelectionIndicator
          page={page}
          isSelected={isSelected}
          isAlreadyLinked={isAlreadyLinked}
        />
        <PageSummary page={page} />
      </button>
      <PageActions page={page} t={t} onDrillInto={onDrillInto} />
    </li>
  );
}
