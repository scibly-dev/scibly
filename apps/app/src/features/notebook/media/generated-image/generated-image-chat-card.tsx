"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { GeneratedImageMetadata } from "./generated-image-types";

import { cn } from "@scibly/ui/utils";
import Image from "next/image";
import { type ReactNode } from "react";

import { GeneratedImageActionButtons } from "./generated-image-action-buttons";
import { GeneratedImageLoading } from "./generated-image-loading";
import { GeneratedImageMetadataPopover } from "./generated-image-metadata-popover";
import { GeneratedImagePreviewFrame } from "./generated-image-preview-frame";
import { GenerationFailureNotice } from "./generation-failure-notice";

type ChatImageLabels = NotebookTranslations["chat"]["imageGeneration"];

interface GeneratedImageChatCardProps {
  state: "loading" | "ready" | "error";
  alt?: string;
  url?: string;
  errorText?: string;
  labels: ChatImageLabels;
  metadata?: GeneratedImageMetadata;
  onInsert?: () => void;
  onDownload?: () => void | Promise<void>;
  isDownloading?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  onOpenInImageEditor?: () => void;
}

export const GenerationError = ({
  labels,
  errorText,
  onRetry,
  retryLabel,
}: Pick<
  GeneratedImageChatCardProps,
  "labels" | "errorText" | "onRetry" | "retryLabel"
>) => {
  return (
    <div className="flex h-full min-h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <GenerationFailureNotice
        title={labels.generationFailed}
        errorText={errorText}
      />
      {onRetry ? (
        <button
          type="button"
          className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          onClick={onRetry}
        >
          {retryLabel ?? "Retry"}
        </button>
      ) : null}
    </div>
  );
};

export const ReadyGeneratedImage = (
  props: Pick<
    GeneratedImageChatCardProps,
    | "alt"
    | "url"
    | "metadata"
    | "labels"
    | "isDownloading"
    | "onDownload"
    | "onInsert"
    | "onOpenInImageEditor"
  >,
) => {
  if (!props.url) return null;
  return (
    <>
      <Image
        alt={props.alt ?? ""}
        className="animate-in fade-in zoom-in-95 pointer-events-none object-cover duration-700 ease-out"
        crossOrigin="anonymous"
        fill
        sizes="(max-width: 768px) 320px, 320px"
        src={props.url}
      />
      {props.metadata ? (
        <div
          className="absolute bottom-3 left-3 z-10"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <GeneratedImageMetadataPopover
            labels={props.labels.metadata}
            metadata={props.metadata}
            variant="chat"
          />
        </div>
      ) : null}
      <div
        className={cn(
          "absolute top-3 right-3 z-10 flex items-center gap-1.5",
          "pointer-events-none opacity-0 transition-opacity duration-200",
          "group-hover/image-preview:pointer-events-auto group-hover/image-preview:opacity-100",
          "group-focus-within/image-preview:pointer-events-auto group-focus-within/image-preview:opacity-100",
          "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
        )}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <GeneratedImageActionButtons
          isDownloading={props.isDownloading}
          labels={{
            insertIntoScene: props.labels.insertIntoScene,
            open: props.labels.openFullSize,
            downloadImage: props.labels.downloadImage,
            openInImageEditor: props.labels.openInImageEditor,
            moreActions: props.labels.moreActions,
          }}
          onDownload={props.onDownload ?? (() => {})}
          onInsert={props.onInsert}
          onOpenInImageEditor={props.onOpenInImageEditor}
          url={props.url}
          variant="chat"
        />
      </div>
    </>
  );
};

export function GeneratedImageChatCard({
  state,
  alt = "",
  url,
  errorText,
  labels,
  metadata,
  onInsert,
  onDownload,
  isDownloading = false,
  onRetry,
  retryLabel,
  width,
  height,
  aspectRatio,
  onOpenInImageEditor,
}: GeneratedImageChatCardProps) {
  const renderFrame = (children: ReactNode) => (
    <GeneratedImagePreviewFrame
      aspectRatio={aspectRatio}
      className={cn(
        "aspect-square w-full max-w-[320px] bg-neutral-100 dark:bg-neutral-900",
      )}
      fallbackAspectRatio="1 / 1"
      height={height}
      width={width}
    >
      {children}
    </GeneratedImagePreviewFrame>
  );

  if (state === "error" && onRetry) {
    return renderFrame(
      <GenerationError
        labels={labels}
        errorText={errorText}
        onRetry={onRetry}
        retryLabel={retryLabel}
      />,
    );
  }

  return renderFrame(
    <>
      <div
        aria-busy={state === "loading"}
        className={cn(
          "relative h-full w-full",
          state === "ready" && "group/image-preview",
        )}
      >
        {state === "loading" ? (
          <GeneratedImageLoading label={labels.generating} />
        ) : null}

        {state === "error" ? (
          <GenerationError labels={labels} errorText={errorText} />
        ) : null}

        {state === "ready" && url ? (
          <ReadyGeneratedImage
            alt={alt}
            url={url}
            metadata={metadata}
            labels={labels}
            isDownloading={isDownloading}
            onDownload={onDownload}
            onInsert={onInsert}
            onOpenInImageEditor={onOpenInImageEditor}
          />
        ) : null}
      </div>
    </>,
  );
}
