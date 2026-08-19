"use client";

import type { ReactNode } from "react";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";

import { SourceDropzone } from "./source-dropzone";

type SourceSummary = { id: string; name: string };

export function SourcesPanelView<TSource extends SourceSummary>({
  t,
  sources,
  isLoading,
  uploadsDisabled,
  uploadsDisabledHint,
  onFilesSelected,
  renderSource,
  footer,
  dialogs,
}: {
  t: NotebookTranslations;
  sources: readonly TSource[];
  isLoading: boolean;
  uploadsDisabled: boolean;
  uploadsDisabledHint?: string;
  onFilesSelected: (files: FileList) => void;
  renderSource: (source: TSource) => ReactNode;
  footer?: ReactNode;
  dialogs?: ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredSources = normalizedQuery
    ? sources.filter((source) =>
        source.name.toLowerCase().includes(normalizedQuery),
      )
    : sources;

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-5">
      <SourceDropzone
        t={t.sources.dropzone}
        onFilesSelected={onFilesSelected}
        disabled={uploadsDisabled}
        disabledHint={uploadsDisabledHint}
      />

      <div className="relative shrink-0">
        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
        <input
          type="text"
          placeholder={t.sources.searchPlaceholder}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="text-foreground placeholder:text-muted-foreground w-full rounded-lg border border-neutral-100 bg-white py-2 pr-3 pl-8 text-xs outline-none focus:border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-neutral-700"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <Loader2 className="h-5 w-5 text-neutral-400" />
            </div>
          </div>
        ) : filteredSources.length > 0 ? (
          filteredSources.map(renderSource)
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500">
            {t.sources.emptyTitle}
          </div>
        )}
      </div>

      {footer}
      {dialogs}
    </div>
  );
}
