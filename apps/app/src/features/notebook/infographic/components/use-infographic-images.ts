"use client";

import { useMemo, useState } from "react";

import { useNotebookImageInvocations } from "../../chat/runtime/context";
import { usePaginatedGeneratedImages } from "../../media/generated-image/use-paginated-generated-images";
import { mergeInfographicImages } from "./merge-infographic-images";

export function useInfographicImages({
  notebookId,
  orgSlug,
}: {
  notebookId: string | undefined;
  orgSlug: string;
}) {
  const [railScrollRoot, setRailScrollRoot] = useState<HTMLDivElement | null>(
    null,
  );
  const {
    items: libraryItems,
    isLoading,
    isFetchingNextPage,
    loadMoreRef,
  } = usePaginatedGeneratedImages({
    notebookId,
    orgSlug,
    scrollRoot: railScrollRoot,
    rootMargin: "48px",
  });

  const chatInvocations = useNotebookImageInvocations();

  const images = useMemo(
    () => mergeInfographicImages(libraryItems, chatInvocations),
    [libraryItems, chatInvocations],
  );

  return {
    images,
    isLoading,
    isFetchingNextPage,
    loadMoreRef,
    setRailScrollRoot,
  };
}
