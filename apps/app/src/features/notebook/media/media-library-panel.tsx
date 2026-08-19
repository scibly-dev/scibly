"use client";

import type { NotebookTranslations } from "../i18n/notebook.types";

import { useState } from "react";

import { useNotebookPresentation } from "../workspace/components/notebook-presentation";
import { useSidebarState } from "../workspace/hooks/use-sidebar-state";
import { MediaLibraryPanelView } from "./generated-image/media-library-panel-view";
import { useGeneratedImageActions } from "./generated-image/use-generated-image-actions";
import { usePaginatedGeneratedImages } from "./generated-image/use-paginated-generated-images";

interface MediaLibraryPanelProps {
  t: NotebookTranslations;
  notebookId: string | undefined;
  orgSlug: string;
}

export function MediaLibraryPanel({
  t,
  notebookId,
  orgSlug,
}: MediaLibraryPanelProps) {
  const { insert, download, isDownloading } = useGeneratedImageActions();
  const openStudioTool = useSidebarState((s) => s.openStudioTool);
  const presentation = useNotebookPresentation();
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const { items, isLoading, isFetchingNextPage, loadMoreRef } =
    usePaginatedGeneratedImages({
      notebookId,
      orgSlug,
      scrollRoot,
      rootMargin: "120px",
    });

  return (
    <MediaLibraryPanelView
      t={t}
      images={items}
      isLoading={Boolean(notebookId) && isLoading}
      isFetchingNextPage={isFetchingNextPage}
      loadMoreRef={loadMoreRef}
      setScrollRoot={setScrollRoot}
      actions={{
        isDownloading: (image) => isDownloading(image.id),
        onDownload: (image) =>
          download({
            url: image.url,
            alt: image.alt,
            imageId: image.id,
          }),
        onInsert: (image) => void insert(image.url, image.alt),
        onOpenInImageEditor:
          presentation.imageEditor === "enabled"
            ? (image) => openStudioTool("imageEditor", image.id)
            : undefined,
      }}
    />
  );
}
