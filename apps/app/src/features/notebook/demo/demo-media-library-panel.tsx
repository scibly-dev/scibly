"use client";

import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";
import type { GeneratedImageListItem } from "@/features/notebook/media/tools/image-schemas";

import { MediaLibraryPanelView } from "@/features/notebook/media/generated-image/media-library-panel-view";

import { useShowcaseSnapshot } from "./showcase-runtime";

export function DemoMediaLibraryPanel({ t }: { t: NotebookTranslations }) {
  const snapshot = useShowcaseSnapshot();
  const images: GeneratedImageListItem[] = snapshot.generatedImages.map(
    (image) => ({
      ...image,
      createdAt: new Date(image.createdAt),
    }),
  );

  return <MediaLibraryPanelView t={t} images={images} isLoading={false} />;
}
