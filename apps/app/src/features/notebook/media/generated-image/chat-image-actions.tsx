"use client";

import type { SharedImageActionProps } from "./generated-image-action-buttons.types";

import { cn } from "@scibly/ui/utils";
import { Download, ExternalLink, LayoutTemplate, Loader2 } from "lucide-react";

import { TooltipProvider } from "@/shared/ui/components/tooltip";

import { GeneratedImageOverlayActionButton } from "./generated-image-overlay-action-button";

export function ChatImageActions({
  url,
  labels,
  onInsert,
  onDownload,
  isDownloading = false,
}: SharedImageActionProps) {
  const iconClassName = "h-4 w-4";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center gap-1.5">
        {onInsert ? (
          <GeneratedImageOverlayActionButton
            label={labels.insertIntoScene}
            onClick={onInsert}
            variant="chat"
          >
            <LayoutTemplate className={iconClassName} strokeWidth={2} />
          </GeneratedImageOverlayActionButton>
        ) : null}
        <GeneratedImageOverlayActionButton
          href={url}
          label={labels.open}
          variant="chat"
        >
          <ExternalLink className={iconClassName} strokeWidth={2} />
        </GeneratedImageOverlayActionButton>
        <GeneratedImageOverlayActionButton
          isLoading={isDownloading}
          label={labels.downloadImage}
          onClick={() => void onDownload()}
          variant="chat"
        >
          {isDownloading ? (
            <Loader2 className={cn(iconClassName, "animate-spin")} />
          ) : (
            <Download className={iconClassName} strokeWidth={2} />
          )}
        </GeneratedImageOverlayActionButton>
      </div>
    </TooltipProvider>
  );
}
