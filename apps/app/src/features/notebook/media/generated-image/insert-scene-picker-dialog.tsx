"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { ImageInsertTarget } from "./insert-target-storage";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";
import { cn } from "@scibly/ui/utils";
import { Loader2 } from "lucide-react";

interface InsertScenePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: Pick<
    NotebookTranslations["chat"]["imageGeneration"],
    "chooseSceneTitle" | "chooseSceneDescription"
  >;
  targets: ImageInsertTarget[];
  isLoading: boolean;
  onSelect: (target: ImageInsertTarget) => void;
}

export function InsertScenePickerDialog({
  open,
  onOpenChange,
  labels,
  targets,
  isLoading,
  onSelect,
}: InsertScenePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-neutral-200/80 px-5 py-4 dark:border-neutral-800/80">
          <DialogTitle className="text-base">
            {labels.chooseSceneTitle}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {labels.chooseSceneDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar max-h-[min(60vh,420px)] overflow-y-auto px-2 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          ) : targets.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {labels.chooseSceneDescription}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {targets.map((target) => (
                <li key={target.sceneId}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition-colors",
                      "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                    )}
                    onClick={() => onSelect(target)}
                  >
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {target.sceneTitle}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {target.lessonTitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
