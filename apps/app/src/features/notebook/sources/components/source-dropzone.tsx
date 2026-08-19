"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { UploadCloud } from "lucide-react";
import { useRef } from "react";

import { ACCEPTED_EXTENSIONS } from "@/shared/content/sources/constants";

interface SourceDropzoneProps {
  t: NotebookTranslations["sources"]["dropzone"];
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
  disabledHint?: string;
}

export function SourceDropzone({
  t,
  onFilesSelected,
  disabled = false,
  disabledHint,
}: SourceDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    if (disabled) return;
    fileInputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) onFilesSelected(e.target.files);
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleChange}
        aria-label={t.title}
        disabled={disabled}
      />
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={t.title}
        aria-disabled={disabled}
        className="group flex shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50/80 data-[disabled=false]:cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/40"
        data-disabled={disabled}
      >
        <UploadCloud className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-400" />
        <div className="flex flex-col gap-0.5 text-center">
          <span className="text-[13px] text-neutral-700 dark:text-neutral-300">
            {t.title}
          </span>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
            {disabled && disabledHint ? disabledHint : t.subtitle}
          </span>
        </div>
      </div>
    </>
  );
}
