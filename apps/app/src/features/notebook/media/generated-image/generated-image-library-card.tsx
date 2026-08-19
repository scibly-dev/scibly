"use client";

import type { GeneratedImageListItem } from "@/features/notebook/media/tools/image-schemas";
import type { ImageMetadataLabels } from "./generated-image-types";

import { cn } from "@scibly/ui/utils";
import Image from "next/image";

import { GeneratedImageActionButtons } from "./generated-image-action-buttons";
import { GeneratedImageMetadataPopover } from "./generated-image-metadata-popover";
import { toGeneratedImageMetadata } from "./generated-image-metadata-utils";

const generatedImageOverlayClassName =
  "pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover/media-card:bg-black/[0.06] group-focus-within/media-card:bg-black/[0.06]";

const generatedImageActionsClassName =
  "pointer-events-none opacity-0 transition-opacity duration-150 group-hover/media-card:pointer-events-auto group-hover/media-card:opacity-100 group-focus-within/media-card:pointer-events-auto group-focus-within/media-card:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100";

interface GeneratedImageLibraryCardProps {
  image: GeneratedImageListItem;
  labels: {
    metadata: ImageMetadataLabels;
  };
  actions?: {
    insertIntoScene: string;
    open?: string;
    downloadImage: string;
    openInImageEditor?: string;
    moreActions?: string;
    onInsert: () => void;
    onDownload: () => void | Promise<void>;
    onOpenInImageEditor?: () => void;
    isDownloading?: boolean;
  };
}

export function GeneratedImageLibraryCard({
  image,
  labels,
  actions,
}: GeneratedImageLibraryCardProps) {
  const metadata = toGeneratedImageMetadata({
    alt: image.alt,
    prompt: image.prompt,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
    byteSize: image.byteSize,
    aspectRatio: image.aspectRatio ?? undefined,
    createdAt: image.createdAt,
  });

  return (
    <article
      className={cn(
        "group/media-card relative aspect-[4/5] overflow-hidden rounded-2xl",
        "bg-neutral-100 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.28)]",
        "ring-1 ring-black/[0.04] dark:bg-neutral-900 dark:ring-white/[0.06]",
        "[contain-intrinsic-size:0_320px] [content-visibility:auto]",
      )}
    >
      <Image
        alt={image.alt}
        className="object-cover"
        crossOrigin="anonymous"
        fill
        loading="lazy"
        sizes="(max-width: 768px) 50vw, 33vw"
        src={image.url}
      />

      <div aria-hidden className={generatedImageOverlayClassName} />

      <div className="absolute bottom-2 left-2 z-10">
        <GeneratedImageMetadataPopover
          labels={labels.metadata}
          metadata={metadata}
          variant="library"
        />
      </div>

      {actions ? (
        <div
          className={cn(
            "absolute top-2 right-2 z-10 flex items-center gap-1.5",
            generatedImageActionsClassName,
          )}
        >
          <GeneratedImageActionButtons
            isDownloading={actions.isDownloading}
            labels={{
              insertIntoScene: actions.insertIntoScene,
              open: actions.open ?? "",
              downloadImage: actions.downloadImage,
              openInImageEditor: actions.openInImageEditor,
              moreActions: actions.moreActions,
            }}
            onDownload={actions.onDownload}
            onInsert={actions.onInsert}
            onOpenInImageEditor={actions.onOpenInImageEditor}
            url={image.url}
            variant="library"
          />
        </div>
      ) : null}
    </article>
  );
}
