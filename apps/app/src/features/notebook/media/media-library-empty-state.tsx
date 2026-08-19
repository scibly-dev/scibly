"use client";

import { ImageIcon } from "lucide-react";

export function MediaLibraryEmptyState({
  emptyTitle,
  empty,
}: {
  emptyTitle: string;
  empty: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-900">
        <ImageIcon className="h-5 w-5 text-neutral-400" />
      </div>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {emptyTitle}
      </p>
      <p className="max-w-[240px] text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        {empty}
      </p>
    </div>
  );
}
