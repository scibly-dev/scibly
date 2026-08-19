"use client";

import type { DataUIPart } from "ai";
import type { RefObject } from "react";
import type { CustomUIDataTypes } from "@/features/notebook/chat/contracts";
import type { api } from "@/shared/api/trpc/client";

import { useCallback } from "react";

import { useLatestRef } from "./use-latest-ref";

type ChatDataPartUtils = ReturnType<typeof api.useUtils>;

export function useChatDataParts({
  orgSlugRef,
  activeNotebookIdRef,
  utils,
  onCourseDelta,
  onCompaction,
}: {
  orgSlugRef: RefObject<string>;
  activeNotebookIdRef: RefObject<string | undefined>;
  utils: ChatDataPartUtils;
  onCourseDelta: (delta: CustomUIDataTypes["courseDelta"]) => void;
  onCompaction: (status: CustomUIDataTypes["compaction"]) => void;
}) {
  const utilsRef = useLatestRef(utils);
  const onCourseDeltaRef = useLatestRef(onCourseDelta);
  const onCompactionRef = useLatestRef(onCompaction);

  return useCallback(
    (dataPart: DataUIPart<CustomUIDataTypes>) => {
      if (dataPart.type === "data-chat-title") {
        const title = String(dataPart.data);
        const notebookId = activeNotebookIdRef.current;
        const orgSlug = orgSlugRef.current;
        if (notebookId) {
          utilsRef.current.notebook.getById.setData(
            { orgSlug, notebookId },
            (old) => (old ? { ...old, title } : old),
          );
          utilsRef.current.notebook.getMeta.setData(
            { orgSlug, notebookId },
            (old) => (old ? { ...old, title } : old),
          );
        }
        return;
      }

      if (dataPart.type === "data-courseDelta") {
        onCourseDeltaRef.current(dataPart.data);
        return;
      }

      if (dataPart.type === "data-compaction") {
        onCompactionRef.current(dataPart.data);
      }
    },
    [
      activeNotebookIdRef,
      orgSlugRef,
      onCompactionRef,
      onCourseDeltaRef,
      utilsRef,
    ],
  );
}
