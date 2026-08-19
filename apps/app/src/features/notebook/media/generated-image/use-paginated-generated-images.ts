"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useNotebookGeneratedImagesQuery } from "./use-notebook-generated-images-query";

export function usePaginatedGeneratedImages({
  notebookId,
  orgSlug,
  scrollRoot,
  rootMargin = "48px",
}: {
  notebookId: string | undefined;
  orgSlug: string;
  scrollRoot: HTMLElement | null;
  rootMargin?: string;
}) {
  const query = useNotebookGeneratedImagesQuery({ notebookId, orgSlug });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const { ref: loadMoreRef, inView } = useInView({
    root: scrollRoot,
    rootMargin,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...query,
    items,
    loadMoreRef,
  };
}
