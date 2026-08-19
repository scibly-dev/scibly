"use client";

import type { NotebookTranslations } from "../i18n/notebook.types";

import { X } from "lucide-react";
import { useState } from "react";

import { isSourceIngesting } from "@/shared/content/sources/constants";

import { useNotebookSources } from "./hooks/use-notebook-sources";

export function SourcesProcessingNotice({
  notebookId,
  t,
}: {
  notebookId: string | undefined;
  t: NotebookTranslations;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const { data: sources = [] } = useNotebookSources(notebookId);

  const processing = sources.filter((s) => isSourceIngesting(s.status));
  if (!processing.some((s) => !dismissed.includes(s.id))) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-2.5 text-[13px] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
    >
      <p className="min-w-0 flex-1">
        {processing.length === 1
          ? t.sources.processingNoticeOne
          : t.sources.processingNoticeMany.replace(
              "{count}",
              String(processing.length),
            )}
      </p>
      <button
        aria-label={t.sources.processingNoticeDismiss}
        className="shrink-0 rounded-lg p-1 transition-colors hover:bg-amber-100/80 dark:hover:bg-amber-950/40"
        onClick={() => setDismissed(processing.map((s) => s.id))}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
