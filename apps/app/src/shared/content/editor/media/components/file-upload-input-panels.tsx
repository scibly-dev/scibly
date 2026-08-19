"use client";

import type { MediaTypes } from "@/lib/media-types";
import type { FileSelectionEvent } from "@/shared/content/editor/media/utils/media";

import { Input } from "@scibly/ui/components/input";
import { cn } from "@scibly/ui/utils";
import { ArrowRight, Link2, Trash2, Upload } from "lucide-react";

export type FileUploadTab = "upload" | "embed";

export function RemoveAction({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="border-t border-neutral-100 p-2 dark:border-neutral-800/80">
      <button
        type="button"
        onClick={onRemove}
        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-[13px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </button>
    </div>
  );
}

export function UploadTabs({
  embedLabel,
  setTab,
  tab,
  uploadLabel,
}: {
  embedLabel: string;
  setTab: (tab: FileUploadTab) => void;
  tab: FileUploadTab;
  uploadLabel: string;
}) {
  return (
    <div className="flex border-b border-neutral-100 px-1 pt-1 dark:border-neutral-800/80">
      {(
        [
          ["upload", uploadLabel],
          ["embed", embedLabel],
        ] as const
      ).map(([tabName, label]) => (
        <button
          key={tabName}
          onClick={() => setTab(tabName)}
          className={cn(
            "flex-1 rounded-t-lg py-2.5 text-[12px] font-semibold tracking-wide transition-colors duration-150",
            tab === tabName
              ? "border-b-2 border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
              : "border-b-2 border-transparent text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function handleDroppedFile(
  event: React.DragEvent<HTMLDivElement>,
  setIsDragging: (isDragging: boolean) => void,
  handleUpload: (event: FileSelectionEvent) => Promise<void>,
) {
  event.preventDefault();
  setIsDragging(false);
  if (!event.dataTransfer.files.length) return;

  void handleUpload(event);
}

export function UploadPanel({
  fileInputRef,
  handleUpload,
  isDragging,
  mediaType,
  setIsDragging,
  uploadLabel,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleUpload: (event: FileSelectionEvent) => Promise<void>;
  isDragging: boolean;
  mediaType: MediaTypes;
  setIsDragging: (isDragging: boolean) => void;
  uploadLabel: string;
}) {
  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => handleDroppedFile(event, setIsDragging, handleUpload)}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed py-8 transition-all duration-150",
        isDragging
          ? "border-neutral-400 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900"
          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50",
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={`${mediaType}/*`}
        className="hidden"
        onChange={handleUpload}
      />
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150",
          isDragging
            ? "bg-neutral-200 dark:bg-neutral-700"
            : "bg-neutral-100 group-hover:bg-neutral-200 dark:bg-neutral-800 dark:group-hover:bg-neutral-700",
        )}
      >
        <Upload
          className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
          strokeWidth={1.75}
        />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
          {uploadLabel}
        </span>
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
          {isDragging ? "Drop to upload" : "or drag and drop"}
        </span>
      </div>
    </div>
  );
}

export function EmbedPanel({
  changeMediaLabel,
  embedLabel,
  handleEmbed,
  hideUploadTab,
  placeholder,
  setUrl,
  url,
}: {
  changeMediaLabel: string;
  embedLabel: string;
  handleEmbed: () => void;
  hideUploadTab: boolean;
  placeholder: string;
  setUrl: (url: string) => void;
  url: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {hideUploadTab ? (
        <div className="flex items-center gap-2 pb-1">
          <Link2
            className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500"
            strokeWidth={1.75}
          />
          <span className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
            {embedLabel}
          </span>
        </div>
      ) : null}
      <div className="relative flex items-center">
        <Input
          placeholder={placeholder}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            handleEmbed();
          }}
          className="h-9 rounded-xl border-neutral-200 bg-neutral-50 pr-10 text-[13px] placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
        />
        <button
          onClick={handleEmbed}
          disabled={!url.trim()}
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-900 text-white transition-all duration-150 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          aria-label={changeMediaLabel}
        >
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
        {changeMediaLabel}
      </p>
    </div>
  );
}
