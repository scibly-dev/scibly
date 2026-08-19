"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { ChevronRight, Home } from "lucide-react";

type T = NotebookTranslations["sources"]["pagePicker"];

export interface BreadcrumbEntry {
  id: string;
  title: string;
  nodeType: "page" | "database";
}

interface PagePickerBreadcrumbsProps {
  breadcrumbs: BreadcrumbEntry[];
  isFetching: boolean;
  isLoading: boolean;
  t: T;
  onNavigate: (index: number) => void;
}

export function PagePickerBreadcrumbs({
  breadcrumbs,
  isFetching,
  isLoading,
  t,
  onNavigate,
}: PagePickerBreadcrumbsProps) {
  const hasBreadcrumbs = breadcrumbs.length > 0;

  return (
    <div className="flex min-h-[36px] items-center gap-1 overflow-x-auto border-b border-neutral-100 px-3 dark:border-neutral-800/60">
      <button
        type="button"
        onClick={() => onNavigate(-1)}
        className={cn(
          "flex shrink-0 items-center justify-center rounded p-1.5 transition-colors",
          hasBreadcrumbs
            ? "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            : "cursor-default text-neutral-300 dark:text-neutral-600",
        )}
        aria-label={t.backToRoot}
        disabled={!hasBreadcrumbs}
      >
        <Home className="h-3.5 w-3.5" />
      </button>

      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-0.5">
          <ChevronRight className="h-3 w-3 shrink-0 text-neutral-300 dark:text-neutral-600" />
          <button
            type="button"
            onClick={() => onNavigate(i)}
            className={cn(
              "max-w-[160px] truncate rounded px-1.5 py-0.5 text-[12px] font-medium transition-colors",
              i === breadcrumbs.length - 1
                ? "text-neutral-700 dark:text-neutral-200"
                : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300",
            )}
          >
            {crumb.title}
          </button>
        </span>
      ))}

      {/* Fetching indicator — right side, avoids layout shift */}
      {isFetching && !isLoading && (
        <span className="ml-auto shrink-0 text-[10px] text-neutral-400">
          {t.loading}
        </span>
      )}
    </div>
  );
}
