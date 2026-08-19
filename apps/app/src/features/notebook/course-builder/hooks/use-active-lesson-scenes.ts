"use client";

import { api } from "@/shared/api/trpc/client";

const SCENE_LIST_STALE_TIME_MS = 30_000;

export function useActiveLessonScenes(activeLessonId: string | undefined) {
  return api.scene.getLessonScenes.useQuery(
    { lessonId: activeLessonId ?? "" },
    {
      enabled: !!activeLessonId,
      staleTime: SCENE_LIST_STALE_TIME_MS,
    },
  );
}
