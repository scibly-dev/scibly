import type { PlayerLesson } from "@/features/learning/course-player/client";

import { useMemo } from "react";

import {
  computeScorePct,
  normalizePreviewCourse,
  usePlayerViewState,
} from "@/features/learning/course-player/client";
import { api } from "@/shared/api/trpc/client";

interface UsePreviewNavigationParams {
  courseId: string;
}

export function usePreviewNavigation({ courseId }: UsePreviewNavigationParams) {
  const { data: rawCourse, isLoading } = api.course.getPreview.useQuery({
    courseId,
  });

  const course = useMemo(
    () => (rawCourse ? normalizePreviewCourse(rawCourse) : undefined),
    [rawCourse],
  );

  const {
    viewState,
    progress,
    pathProgression,
    nextLessonTitle,
    initialLessonSP,
    initialPendingSubmissions,
    getInitialSceneIndex,
    handleLessonSessionChange,
    handleSelectLesson,
    handleLessonComplete,
    handleExitLesson,
    handleContinueFromComplete,
    handleBackToOverview,
    clearPathProgression,
  } = usePlayerViewState({ course });

  const courseMaxSP = course?.maxSp ?? 0;

  const currentLesson: PlayerLesson | undefined =
    course && (viewState.type === "lesson" || viewState.type === "complete")
      ? course.lessons.find((l) => l.id === viewState.lessonId)
      : undefined;

  const lessonMaxSp = currentLesson?.maxSp ?? 0;

  return {
    mode: "preview" as const,
    courseId,
    isLoading,
    course,
    progress,
    viewState,
    currentLesson,
    initialLessonSP,
    initialPendingSubmissions,
    getInitialSceneIndex,
    lessonMaxSp,
    courseMaxSP,
    nextLessonTitle,
    pathProgression,
    clearPathProgression,

    achievedScorePct: computeScorePct(progress.totalSP, courseMaxSP),
    requiredScorePct: course?.passingScorePct ?? null,
    handleSelectLesson,
    handleLessonSessionChange,
    handleLessonComplete,
    handleExitLesson,
    handleContinueFromComplete,
    handleBackToOverview,
    restartCount: 0 as const,
  };
}
