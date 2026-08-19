"use client";

import type { ImageGenerationInvocation } from "../../media/generated-image/tool-part";

import { cn } from "@scibly/ui/utils";
import { AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

interface InfographicThumbnailProps {
  invocation: ImageGenerationInvocation;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  selectImageLabel: string;
  generatingLabel: string;
}

export function InfographicThumbnail({
  invocation,
  index,
  isSelected,
  onSelect,
  selectImageLabel,
  generatingLabel,
}: InfographicThumbnailProps) {
  const url = invocation.output?.url;
  const alt = invocation.output?.alt ?? invocation.alt ?? "";

  return (
    <button
      type="button"
      onClick={onSelect}
      title={selectImageLabel.replace("{index}", String(index + 1))}
      aria-label={selectImageLabel.replace("{index}", String(index + 1))}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "bg-ground relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 transition-[filter,opacity,border-color] duration-200 ease-out outline-none dark:bg-neutral-900",
        "focus:outline-none focus-visible:outline-none",
        isSelected
          ? "border-[#0066ff]"
          : "border-hairline opacity-70 grayscale hover:opacity-90 dark:border-neutral-800",
      )}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "48px 48px",
      }}
    >
      {invocation.isPending ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2
            aria-label={generatingLabel}
            className="text-ink-faint h-4 w-4 animate-spin"
          />
        </div>
      ) : null}

      {invocation.isError ? (
        <div className="flex h-full w-full items-center justify-center">
          <AlertCircle
            aria-hidden
            className="text-ink-faint h-4 w-4 dark:text-neutral-500"
          />
        </div>
      ) : null}

      {url && !invocation.isPending ? (
        <Image
          alt={alt}
          className="object-cover"
          crossOrigin="anonymous"
          fill
          sizes="48px"
          src={url}
        />
      ) : null}
    </button>
  );
}
