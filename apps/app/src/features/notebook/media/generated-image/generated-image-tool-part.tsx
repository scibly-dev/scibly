"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type { ImageGenerationInvocation } from "./tool-part";

import { useNotebookPresentation } from "../../workspace/components/notebook-presentation";
import { useSidebarState } from "../../workspace/hooks/use-sidebar-state";
import { GeneratedImageChatCard } from "./generated-image-chat-card";
import { toGeneratedImageMetadata } from "./generated-image-metadata-utils";
import { useGeneratedImageActions } from "./use-generated-image-actions";

interface GeneratedImageToolPartProps {
  invocation: ImageGenerationInvocation;
  t: NotebookTranslations;
  onRetry?: () => void;
}

export function GeneratedImageToolPart({
  invocation,
  t,
  onRetry,
}: GeneratedImageToolPartProps) {
  const labels = t.chat.imageGeneration;
  const { insert, download, isDownloading } = useGeneratedImageActions();
  const openStudioTool = useSidebarState((s) => s.openStudioTool);
  const presentation = useNotebookPresentation();

  const handleOpenInImageEditor = () => {
    const imageId =
      invocation.output?.imageId ??
      (invocation.toolCallId ? `pending:${invocation.toolCallId}` : null);
    if (!imageId) return;
    openStudioTool("imageEditor", imageId);
  };

  if (invocation.isError) {
    return (
      <GeneratedImageChatCard
        errorText={invocation.errorText}
        labels={labels}
        onRetry={onRetry}
        retryLabel={labels.retryGeneration}
        state="error"
      />
    );
  }

  if (invocation.isPending) {
    return <GeneratedImageChatCard labels={labels} state="loading" />;
  }

  const output = invocation.output;
  if (!output?.url) {
    return <GeneratedImageChatCard labels={labels} state="error" />;
  }

  return (
    <GeneratedImageChatCard
      alt={output.alt}
      isDownloading={isDownloading(output.imageId)}
      labels={labels}
      metadata={toGeneratedImageMetadata({
        alt: output.alt,
        prompt: output.prompt ?? invocation.prompt ?? "",
        width: output.width ?? undefined,
        height: output.height ?? undefined,
        byteSize: output.byteSize,
        aspectRatio: output.aspectRatio ?? undefined,
        createdAt: new Date(),
      })}
      onDownload={async () => {
        await download({
          url: output.url,
          alt: output.alt,
          imageId: output.imageId,
        });
      }}
      onInsert={() => void insert(output.url, output.alt)}
      onOpenInImageEditor={
        presentation.imageEditor === "enabled" &&
        (invocation.toolCallId || invocation.output?.imageId)
          ? handleOpenInImageEditor
          : undefined
      }
      state="ready"
      url={output.url}
    />
  );
}
