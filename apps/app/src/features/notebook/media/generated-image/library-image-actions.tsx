"use client";

import type { SharedImageActionProps } from "./generated-image-action-buttons.types";

import { cn } from "@scibly/ui/utils";
import { Download, ExternalLink, LayoutTemplate, Loader2 } from "lucide-react";

import { TooltipProvider } from "@/shared/ui/components/tooltip";

import { GeneratedImageOverlayActionButton } from "./generated-image-overlay-action-button";

export function LibraryImageActions({
  url,
  labels,
  onInsert,
  onDownload,
  isDownloading = false,
}: SharedImageActionProps) {
  const iconClassName = "h-3.5 w-3.5";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col gap-1.5">
        {onInsert ? (
          <GeneratedImageOverlayActionButton
            label={labels.insertIntoScene}
            onClick={onInsert}
            variant="library"
          >
            <LayoutTemplate className={iconClassName} />
          </GeneratedImageOverlayActionButton>
        ) : null}
        <GeneratedImageOverlayActionButton
          href={url}
          label={labels.open}
          variant="library"
        >
          <ExternalLink className={iconClassName} />
        </GeneratedImageOverlayActionButton>
        <GeneratedImageOverlayActionButton
          isLoading={isDownloading}
          label={labels.downloadImage}
          onClick={() => void onDownload()}
          variant="library"
        >
          {isDownloading ? (
            <Loader2 className={cn(iconClassName, "animate-spin")} />
          ) : (
            <Download className={iconClassName} />
          )}
        </GeneratedImageOverlayActionButton>
      </div>
    </TooltipProvider>
  );
}
