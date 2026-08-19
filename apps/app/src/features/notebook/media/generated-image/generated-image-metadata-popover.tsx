"use client";

import type {
  GeneratedImageMetadata,
  GeneratedImageOverlayVariant,
  ImageMetadataLabels,
} from "./generated-image-types";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@scibly/ui/components/popover";
import { cn } from "@scibly/ui/utils";
import { Info } from "lucide-react";

import { GeneratedImageMetadataRow } from "./generated-image-metadata-row";
import {
  formatCreatedAt,
  formatDimensions,
  formatFileSize,
} from "./generated-image-metadata-utils";
import { overlayButtonClassNames } from "./overlay-button-class-names";

interface GeneratedImageMetadataPopoverProps {
  metadata: GeneratedImageMetadata;
  labels: ImageMetadataLabels;
  variant?: GeneratedImageOverlayVariant;
  className?: string;
}

export function GeneratedImageMetadataPopover({
  metadata,
  labels,
  variant = "library",
  className,
}: GeneratedImageMetadataPopoverProps) {
  const dimensions = formatDimensions(metadata.width, metadata.height);
  const fileSize = formatFileSize(metadata.byteSize);
  const createdAt = formatCreatedAt(metadata.createdAt);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={labels.showDetails}
          className={cn(overlayButtonClassNames[variant], className)}
          onClick={(event) => event.stopPropagation()}
          type="button"
        >
          <Info
            className={variant === "chat" ? "h-4 w-4" : "h-3.5 w-3.5"}
            strokeWidth={2}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-72 flex-col gap-3 p-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
        side="top"
      >
        <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
          {labels.title}
        </p>
        <dl className="custom-scrollbar flex max-h-56 flex-col gap-2.5 overflow-y-auto">
          <GeneratedImageMetadataRow label={labels.alt} value={metadata.alt} />
          <GeneratedImageMetadataRow
            label={labels.prompt}
            value={metadata.prompt}
          />
          <GeneratedImageMetadataRow
            label={labels.dimensions}
            value={dimensions}
          />
          <GeneratedImageMetadataRow label={labels.fileSize} value={fileSize} />
          <GeneratedImageMetadataRow
            label={labels.aspectRatio}
            value={metadata.aspectRatio}
          />
          <GeneratedImageMetadataRow label={labels.created} value={createdAt} />
        </dl>
      </PopoverContent>
    </Popover>
  );
}
