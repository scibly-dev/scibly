"use client";

import { useEffect, useRef } from "react";

import { api } from "@/shared/api/trpc/client";

import { useNotebookImageInvocations } from "../../chat/runtime/context";
import { refreshGeneratedImageLibrary } from "../generated-image/refresh-generated-image-library";

export function useInvalidateGeneratedImagesOnNewChatImages({
  notebookId,
  orgSlug,
}: {
  notebookId: string | undefined;
  orgSlug: string;
}) {
  const utils = api.useUtils();
  const knownImageIdsRef = useRef(new Set<string>());
  const imageInvocations = useNotebookImageInvocations();

  useEffect(() => {
    knownImageIdsRef.current = new Set();
  }, [notebookId]);

  useEffect(() => {
    if (!notebookId) return;

    const completedIds = imageInvocations
      .filter((invocation) => invocation.isDone && invocation.output?.imageId)
      .map((invocation) => invocation.output!.imageId);

    const newIds = completedIds.filter(
      (id) => !knownImageIdsRef.current.has(id),
    );
    if (newIds.length === 0) return;

    for (const id of newIds) {
      knownImageIdsRef.current.add(id);
    }

    refreshGeneratedImageLibrary(utils.notebook.generatedImage.list, {
      notebookId,
      orgSlug,
    });
  }, [
    imageInvocations,
    notebookId,
    orgSlug,
    utils.notebook.generatedImage.list,
  ]);
}
