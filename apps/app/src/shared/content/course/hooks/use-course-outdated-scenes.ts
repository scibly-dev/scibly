"use client";

import { api } from "@/shared/api/trpc/client";

export function useCourseOutdatedScenes(courseId: string | undefined) {
  return api.course.getOutdatedScenes.useQuery(
    { courseId: courseId ?? "" },
    {
      enabled: !!courseId,
      staleTime: 30_000,

      refetchOnMount: true,
    },
  );
}
