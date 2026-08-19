"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";

import { GeneratedImageLoading } from "../../media/generated-image/generated-image-loading";
import { GeneratedImagePreviewFrame } from "../../media/generated-image/generated-image-preview-frame";
import { GenerationFailureNotice } from "../../media/generated-image/generation-failure-notice";

interface InfographicPanelImageFrameProps {
  state: "loading" | "error";
  alt?: string;
  errorText?: string;
  labels: NotebookTranslations["chat"]["imageGeneration"];
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export function InfographicPanelImageFrame({
  state,
  alt = "",
  errorText,
  labels,
  width,
  height,
  aspectRatio,
}: InfographicPanelImageFrameProps) {
  return (
    <GeneratedImagePreviewFrame
      className={cn(
        "border-hairline bg-ground-soft relative mx-auto w-full overflow-hidden rounded-[20px] border-2",
        "max-h-[calc(100vh-420px)] dark:border-neutral-800 dark:bg-neutral-900/50",
      )}
      aspectRatio={aspectRatio}
      width={width}
      height={height}
    >
      <div aria-busy={state === "loading"} className="relative h-full w-full">
        {state === "loading" ? (
          <GeneratedImageLoading label={labels.generating} />
        ) : null}

        {state === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <GenerationFailureNotice
              title={labels.generationFailed}
              errorText={errorText}
            />
            {alt ? <span className="sr-only">{alt}</span> : null}
          </div>
        ) : null}
      </div>
    </GeneratedImagePreviewFrame>
  );
}
