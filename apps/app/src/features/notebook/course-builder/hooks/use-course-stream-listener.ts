"use client";

import { useCallback } from "react";

import { type CourseDelta } from "@/shared/ai/types";
import { api } from "@/shared/api/trpc/client";

import { applyCourseDelta } from "./apply-course-delta";
import { openCourseBuilderStudio } from "./open-course-builder-studio";

export function useCourseStreamListener() {
  const utils = api.useUtils();

  return useCallback(
    (delta: CourseDelta) => {
      void applyCourseDelta(delta, {
        client: utils,
        openStudio: () => openCourseBuilderStudio(),
      });
    },
    [utils],
  );
}
