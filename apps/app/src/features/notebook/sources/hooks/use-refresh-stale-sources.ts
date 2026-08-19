"use client";

import { useEffect, useRef } from "react";

import { api } from "@/shared/api/trpc/client";

import { invalidateCourseSceneState } from "../../course-builder/hooks/invalidate-course-scene-state";

// The ref (not the effect's dependency list) is what limits this to one call
// per id — a remount under the same id would otherwise re-open it, and
// clearing the ref on failure would spin since `open` is a fresh closure
// every render.
function useOpenedOnce(id: string | undefined, open: (id: string) => void) {
  const opened = useRef<string>(undefined);

  useEffect(() => {
    if (!id || opened.current === id) return;
    opened.current = id;
    open(id);
  }, [id, open]);
}

// The freshness poll only marks a changed source; clearing the mark by
// actually ingesting it happens client-side, on open.
export function useRefreshStaleNotebookSources(notebookId: string | undefined) {
  const utils = api.useUtils();
  const refresh = api.notebook.source.refreshStale.useMutation({
    retry: 1,
    onSuccess: ({ refreshed }, { notebookId }) => {
      if (refreshed > 0) {
        void utils.notebook.source.list.invalidate({ notebookId });
      }
    },
    onError: (error) =>
      console.error("[SourceRefresh] Notebook refresh failed:", error),
  });

  useOpenedOnce(notebookId, (id) => refresh.mutate({ notebookId: id }));
}

export function useRefreshStaleCourseSources(courseId: string | undefined) {
  const utils = api.useUtils();
  const refresh = api.notebook.source.refreshStaleForCourse.useMutation({
    retry: 1,
    onSuccess: ({ refreshed }, { courseId }) => {
      if (refreshed > 0) {
        invalidateCourseSceneState(utils, { courseId, allLessons: true });
      }
    },
    onError: (error) =>
      console.error("[SourceRefresh] Course refresh failed:", error),
  });

  useOpenedOnce(courseId, (id) => refresh.mutate({ courseId: id }));
}
