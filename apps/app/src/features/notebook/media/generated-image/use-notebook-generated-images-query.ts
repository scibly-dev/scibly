"use client";

import { GENERATED_IMAGE_PAGE_SIZE } from "@/features/notebook/media/tools/image-schemas";
import { api } from "@/shared/api/trpc/client";

export function useNotebookGeneratedImagesQuery({
  notebookId,
  orgSlug,
}: {
  notebookId: string | undefined;
  orgSlug: string;
}) {
  return api.notebook.generatedImage.list.useInfiniteQuery(
    notebookId
      ? { notebookId, orgSlug, limit: GENERATED_IMAGE_PAGE_SIZE }
      : { notebookId: "", orgSlug, limit: GENERATED_IMAGE_PAGE_SIZE },
    {
      enabled: Boolean(notebookId),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnMount: true,
    },
  );
}
