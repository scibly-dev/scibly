import type { api } from "@/shared/api/trpc/client";

import { useCourseBuilderStore } from "../course-builder-store";
import { openCourseBuilderStudio } from "./open-course-builder-studio";

type Utils = ReturnType<typeof api.useUtils>;

interface OpenSceneInCourseBuilderParams {
  courseId: string;
  courseTitle?: string;
  lesson?: { id: string; title?: string };
  scene?: { id: string; title?: string };

  openStudio?: boolean;
}

export async function openSceneInCourseBuilder(
  utils: Utils,
  {
    courseId,
    courseTitle,
    lesson,
    scene,
    openStudio = true,
  }: OpenSceneInCourseBuilderParams,
): Promise<void> {
  if (openStudio) {
    openCourseBuilderStudio();
  }

  let title = courseTitle;
  if (!title) {
    const course = await utils.client.course.getById.query({ courseId });
    title = course?.title ?? "Course";
  }

  const resolvedTitle = title ?? "Course";
  const { openCourse, setActiveLesson, setActiveScene } =
    useCourseBuilderStore.getState();
  openCourse({ course: { id: courseId, title: resolvedTitle } });

  if (lesson) {
    setActiveLesson({
      id: lesson.id,
      title: lesson.title ?? "Lesson",
    });
  }

  if (scene) {
    setActiveScene({
      id: scene.id,
      title: scene.title ?? "Scene",
    });
  }
}
