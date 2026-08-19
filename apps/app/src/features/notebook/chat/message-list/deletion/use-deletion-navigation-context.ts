"use client";

import type { DeletionInvocation } from "./deletion.types";

import { useMemo } from "react";

import { api } from "@/shared/api/trpc/client";

import { useCourseBuilderStore } from "../../../course-builder/course-builder-store";

export function useDeletionNavigationContext(invocation: DeletionInvocation) {
  const sceneIds = useMemo(
    () =>
      invocation.kind === "scene"
        ? invocation.items.map((item) => item.id)
        : [],
    [invocation.items, invocation.kind],
  );

  const needsSceneLookup =
    !invocation.courseId && invocation.kind === "scene" && sceneIds.length > 0;

  const { data: lookedUp, isLoading: isLookingUpCourse } =
    api.scene.getDeletionNavigationContext.useQuery(
      { sceneIds },
      { enabled: needsSceneLookup },
    );

  const courseId = invocation.courseId ?? lookedUp?.courseId;
  const courseTitle = lookedUp?.courseTitle;
  const focusLesson = invocation.focusLesson ?? lookedUp?.focusLesson;

  const builderCourseId = useCourseBuilderStore((state) => state.course?.id);
  const isCourseOpenInBuilder = Boolean(
    courseId && builderCourseId === courseId,
  );

  return {
    courseId,
    courseTitle,
    focusLesson,
    isCourseOpenInBuilder,
    isNavigationLoading: needsSceneLookup && isLookingUpCourse,
  };
}
