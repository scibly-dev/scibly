"use client";

import { useEffect } from "react";

import { useCourseBuilderStore } from "../course-builder-store";
import { useCourseSceneTargets } from "./use-course-scene-targets";

interface UseInitCourseBuilderSelectionParams {
  linkedCourse: { id: string; title: string } | null | undefined;
}

// Every move here uses `system` origin: an `author` origin would detach the
// builder before the author has done anything.
export function useInitCourseBuilderSelection({
  linkedCourse,
}: UseInitCourseBuilderSelectionParams) {
  const { targets, isLoading } = useCourseSceneTargets(linkedCourse?.id);

  useEffect(() => {
    if (!linkedCourse) return;

    const { course, openCourse } = useCourseBuilderStore.getState();
    if (course?.id !== linkedCourse.id) {
      openCourse({ course: linkedCourse, origin: "system" });
    }

    const state = useCourseBuilderStore.getState();
    if (state.activeLesson && state.activeScene) return;
    if (isLoading || targets.length === 0) return;

    const firstTarget = targets[0];
    if (!firstTarget) return;

    if (!state.activeLesson) {
      useCourseBuilderStore.getState().setActiveLesson(
        {
          id: firstTarget.lessonId,
          title: firstTarget.lessonTitle,
        },
        "system",
      );
    }

    if (!useCourseBuilderStore.getState().activeScene) {
      useCourseBuilderStore.getState().setActiveScene(
        {
          id: firstTarget.sceneId,
          title: firstTarget.sceneTitle,
        },
        "system",
      );
    }
  }, [linkedCourse, targets, isLoading]);
}
