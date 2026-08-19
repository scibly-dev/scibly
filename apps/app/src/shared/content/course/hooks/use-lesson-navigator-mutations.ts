"use client";

import { api } from "@/shared/api/trpc/client";

interface UseLessonNavigatorMutationsOptions {
  courseId: string | undefined;
  activeLessonId: string | undefined;
  setActiveLesson: (lesson: { id: string; title: string } | undefined) => void;
  onDeleteFailed?: (message: string) => void;
  onDeleteSuccess?: () => void;
}

export function useLessonNavigatorMutations({
  courseId,
  activeLessonId,
  setActiveLesson,
  onDeleteFailed,
  onDeleteSuccess,
}: UseLessonNavigatorMutationsOptions) {
  const utils = api.useUtils();

  const invalidateLessons = () =>
    void utils.course.listLessons.invalidate({ courseId: courseId ?? "" });

  const createLesson = api.course.createLesson.useMutation({
    onSuccess: invalidateLessons,
  });

  const deleteLesson = api.course.deleteLesson.useMutation({
    onSuccess: (result, variables) => {
      if (!result.success) {
        onDeleteFailed?.(result.message);
        return;
      }

      invalidateLessons();

      if (activeLessonId && variables.lessonIds.includes(activeLessonId)) {
        setActiveLesson(undefined);
      }

      onDeleteSuccess?.();
    },
    onError: (err) => {
      onDeleteFailed?.(err.message);
    },
  });

  const updateLesson = api.course.updateLesson.useMutation({
    onSuccess: invalidateLessons,
  });

  return {
    createLesson,
    deleteLesson,
    updateLesson,
    invalidateLessons,
  };
}
