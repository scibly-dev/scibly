"use client";

import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { ChevronRight } from "lucide-react";

import {
  notebookToolRow,
  notebookToolTile,
} from "@/features/notebook/workspace/components/notebook-shell";
import { STUDIO_TOOLS } from "@/features/notebook/workspace/utils/constants";

export function DemoStudioToolList({ t }: { t: NotebookTranslations }) {
  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-4">
      {STUDIO_TOOLS.map((tool) => {
        const TOOL_ICON = tool.Icon;

        return (
          <button
            key={tool.id}
            type="button"
            disabled
            title={t.demo.studioToolUnavailable}
            className={cn("cursor-not-allowed opacity-60", notebookToolRow)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className={cn(notebookToolTile, tool.theme)}>
                <TOOL_ICON className="h-4 w-4 stroke-2" />
              </span>
              <span className="text-ink truncate text-[14px] font-semibold dark:text-neutral-200">
                {t.studio.tools[tool.id]}
              </span>
            </div>
            <ChevronRight className="text-ink-faint h-4 w-4 shrink-0 dark:text-neutral-600" />
          </button>
        );
      })}
    </div>
  );
}
