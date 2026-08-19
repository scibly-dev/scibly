"use client";

import type { GeneratedImageListItem } from "@/features/notebook/media/tools/image-schemas";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { Loader2 } from "lucide-react";

import { MediaLibraryEmptyState } from "../media-library-empty-state";
import { MediaLibrarySkeleton } from "../media-library-skeleton";
import { GeneratedImageLibraryCard } from "./generated-image-library-card";

type ImageActions = {
  onInsert: (image: GeneratedImageListItem) => void;
  onDownload: (image: GeneratedImageListItem) => void | Promise<void>;
  onOpenInImageEditor?: (image: GeneratedImageListItem) => void;
  isDownloading: (image: GeneratedImageListItem) => boolean;
};

export const ImageGrid = ({
  images,
  labels,
  actions,
}: {
  images: readonly GeneratedImageListItem[];
  labels: NotebookTranslations;
  actions?: ImageActions;
}) => {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5", "@md/media:grid-cols-3")}>
      {images.map((image) => (
        <GeneratedImageLibraryCard
          key={image.id}
          image={image}
          labels={{ metadata: labels.chat.imageGeneration.metadata }}
          actions={
            actions
              ? {
                  insertIntoScene: labels.mediaLibrary.insertIntoScene,
                  open: labels.mediaLibrary.open,
                  downloadImage: labels.chat.imageGeneration.downloadImage,
                  openInImageEditor:
                    labels.chat.imageGeneration.openInImageEditor,
                  moreActions: labels.chat.imageGeneration.moreActions,
                  isDownloading: actions.isDownloading(image),
                  onDownload: () => actions.onDownload(image),
                  onInsert: () => actions.onInsert(image),
                  onOpenInImageEditor: actions.onOpenInImageEditor
                    ? () => actions.onOpenInImageEditor?.(image)
                    : undefined,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
};

export function MediaLibraryPanelView({
  t,
  images,
  isLoading,
  isFetchingNextPage = false,
  loadMoreRef,
  setScrollRoot,
  actions,
}: {
  t: NotebookTranslations;
  images: readonly GeneratedImageListItem[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  loadMoreRef?: (node: HTMLDivElement | null) => void;
  setScrollRoot?: (node: HTMLDivElement | null) => void;
  actions?: ImageActions;
}) {
  const labels = t.mediaLibrary;

  if (isLoading) {
    return (
      <div
        ref={setScrollRoot}
        className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div className="@container/media">
          <MediaLibrarySkeleton />
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div
        ref={setScrollRoot}
        className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <MediaLibraryEmptyState
          emptyTitle={labels.emptyTitle}
          empty={labels.empty}
        />
      </div>
    );
  }

  return (
    <div
      ref={setScrollRoot}
      className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto"
    >
      <div className="@container/media px-4 pb-6">
        <ImageGrid images={images} labels={t} actions={actions} />
        {loadMoreRef ? (
          <div
            ref={loadMoreRef}
            className="flex h-10 items-center justify-center pt-2"
          >
            {isFetchingNextPage ? (
              <div className="animate-spin">
                <Loader2 className="h-4 w-4 text-neutral-400" />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
