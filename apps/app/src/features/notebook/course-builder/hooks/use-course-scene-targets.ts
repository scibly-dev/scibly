"use client";

import type { ImageInsertTarget } from "../../media/generated-image/insert-target-storage";

import { useCallback } from "react";

import { api } from "@/shared/api/trpc/client";

interface CourseSceneTargets {
  targets: ImageInsertTarget[];
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useCourseSceneTargets(
  courseId: string | undefined,
): CourseSceneTargets {
  const utils = api.useUtils();
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = api.course.listAllScenesForCourse.useQuery(
    { courseId: courseId ?? "" },
    { enabled: Boolean(courseId) },
  );

  const reload = useCallback(async () => {
    if (!courseId) return;
    await utils.course.listAllScenesForCourse.invalidate({ courseId });
    await refetch();
  }, [courseId, refetch, utils.course.listAllScenesForCourse]);

  const error =
    queryError instanceof Error
      ? queryError
      : queryError
        ? new Error(String(queryError))
        : null;

  return {
    targets: data ?? [],
    isLoading,
    error,
    reload,
  };
}
