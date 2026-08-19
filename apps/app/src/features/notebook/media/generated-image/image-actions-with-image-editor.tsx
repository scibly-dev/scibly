"use client";

import type { SharedImageActionProps } from "./generated-image-action-buttons.types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import {
  Download,
  ExternalLink,
  Image,
  LayoutTemplate,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

import { TooltipProvider } from "@/shared/ui/components/tooltip";

import { GeneratedImageOverlayActionButton } from "./generated-image-overlay-action-button";
import { overlayButtonClassNames } from "./overlay-button-class-names";

export function ImageActionsWithImageEditor({
  url,
  labels,
  variant,
  onInsert,
  onDownload,
  onOpenInImageEditor,
  isDownloading = false,
}: SharedImageActionProps & { onOpenInImageEditor: () => void }) {
  const iconClassName = variant === "library" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center gap-1.5">
        <GeneratedImageOverlayActionButton
          label={labels.openInImageEditor ?? "Open in image editor"}
          onClick={onOpenInImageEditor}
          variant={variant}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className={iconClassName} strokeWidth={2} />
        </GeneratedImageOverlayActionButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={labels.moreActions ?? "More actions"}
              className={overlayButtonClassNames[variant]}
              type="button"
            >
              <MoreHorizontal className={iconClassName} strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onInsert ? (
              <DropdownMenuItem className="gap-2" onClick={onInsert}>
                <LayoutTemplate className="h-4 w-4" />
                {labels.insertIntoScene}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <a
                className="flex cursor-pointer items-center gap-2"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
                {labels.open}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              disabled={isDownloading}
              onClick={() => void onDownload()}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {labels.downloadImage}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
