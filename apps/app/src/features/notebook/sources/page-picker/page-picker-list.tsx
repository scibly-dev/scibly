"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { FileText } from "lucide-react";

import { PagePickerRow } from "./page-picker-row";
import { PagePickerRowSkeleton } from "./page-picker-row-skeleton";

type T = NotebookTranslations["sources"]["pagePicker"];
type PageItem = RouterOutputs["integration"]["searchPages"]["pages"][number];

interface PagePickerListProps {
  pages: PageItem[];
  selected: Set<string>;
  remaining: number;
  isLoading: boolean;
  isSearching: boolean;
  alreadyLinkedIds: Set<string>;
  t: T;
  onToggle: (pageId: string) => void;
  onDrillInto: (page: PageItem) => void;
}

export function PagePickerList({
  pages,
  selected,
  remaining,
  isLoading,
  isSearching,
  alreadyLinkedIds,
  t,
  onToggle,
  onDrillInto,
}: PagePickerListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {/* Fixed count keeps the modal height stable while loading. */}
          {Array.from({ length: 7 }).map((_, i) => (
            <PagePickerRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-neutral-400">
          <FileText className="h-7 w-7 opacity-40" />
          <p className="text-[13px]">
            {isSearching ? t.noResults : t.noSubpagesFound}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
        {pages.map((page) => (
          <PagePickerRow
            key={page.id}
            page={page}
            isSelected={selected.has(page.id)}
            isAlreadyLinked={alreadyLinkedIds.has(page.id)}
            isDisabled={
              !selected.has(page.id) &&
              !page.isDatabase &&
              !alreadyLinkedIds.has(page.id) &&
              selected.size >= remaining
            }
            t={t}
            onToggle={onToggle}
            onDrillInto={onDrillInto}
          />
        ))}
      </ul>
    </div>
  );
}
