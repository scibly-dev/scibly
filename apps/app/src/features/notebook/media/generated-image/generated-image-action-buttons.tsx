"use client";

import type { SharedImageActionProps } from "./generated-image-action-buttons.types";

import { ChatImageActions } from "./chat-image-actions";
import { ImageActionsWithImageEditor } from "./image-actions-with-image-editor";
import { LibraryImageActions } from "./library-image-actions";

interface GeneratedImageActionButtonsProps extends SharedImageActionProps {
  onOpenInImageEditor?: () => void;
}

export function GeneratedImageActionButtons({
  url,
  labels,
  variant,
  onInsert,
  onDownload,
  onOpenInImageEditor,
  isDownloading = false,
}: GeneratedImageActionButtonsProps) {
  if (onOpenInImageEditor) {
    return (
      <ImageActionsWithImageEditor
        isDownloading={isDownloading}
        labels={labels}
        onDownload={onDownload}
        onInsert={onInsert}
        onOpenInImageEditor={onOpenInImageEditor}
        url={url}
        variant={variant}
      />
    );
  }

  if (variant === "chat") {
    return (
      <ChatImageActions
        isDownloading={isDownloading}
        labels={labels}
        onDownload={onDownload}
        onInsert={onInsert}
        url={url}
        variant={variant}
      />
    );
  }

  return (
    <LibraryImageActions
      isDownloading={isDownloading}
      labels={labels}
      onDownload={onDownload}
      onInsert={onInsert}
      url={url}
      variant={variant}
    />
  );
}
