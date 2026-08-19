import type { api } from "@/shared/api/trpc/client";

import { openSceneInCourseBuilder } from "../../../course-builder/hooks/open-scene-in-course-builder";

type Utils = ReturnType<typeof api.useUtils>;

interface OpenDeletionInCourseBuilderParams {
  courseId: string;
  courseTitle?: string;
  focusLesson?: { id: string; title?: string };
}

export async function openDeletionInCourseBuilder(
  utils: Utils,
  { courseId, courseTitle, focusLesson }: OpenDeletionInCourseBuilderParams,
): Promise<void> {
  await openSceneInCourseBuilder(utils, {
    courseId,
    courseTitle,
    lesson: focusLesson,
    openStudio: true,
  });
}
