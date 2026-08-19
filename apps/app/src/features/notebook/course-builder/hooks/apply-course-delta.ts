"use client";

import type { CourseBuilderQueryClient } from "./builder-query-client";

import { assertExhaustive } from "@scibly/lib";

import { type CourseDelta } from "@/shared/ai/types";

import {
  type CourseEntity,
  useCourseBuilderStore,
} from "../course-builder-store";
import {
  applyCourseBuilderDeletionEffects,
  invalidateCourseSceneState,
} from "./invalidate-course-scene-state";

interface CourseDeltaDeps {
  client: CourseBuilderQueryClient;
  openStudio: () => void;
}

function maybeOpenStudio({ openStudio }: CourseDeltaDeps): void {
  const { isFollowingAgent, hasStudioOpenedItself, markStudioOpenedItself } =
    useCourseBuilderStore.getState();
  if (!isFollowingAgent || hasStudioOpenedItself) return;
  markStudioOpenedItself();
  openStudio();
}

async function resolveCourse(
  courseId: string,
  client: CourseBuilderQueryClient,
): Promise<CourseEntity | undefined> {
  const { course, agentTarget } = useCourseBuilderStore.getState();
  if (course?.id === courseId) return course;
  if (agentTarget?.course?.id === courseId) return agentTarget.course;
  try {
    const fetched = await client.course.getById.fetch({ courseId });
    return fetched ? { id: fetched.id, title: fetched.title } : undefined;
  } catch {
    return undefined;
  }
}

async function resolveLesson(
  courseId: string,
  lessonId: string,
  client: CourseBuilderQueryClient,
): Promise<CourseEntity | undefined> {
  const { activeLesson, agentTarget } = useCourseBuilderStore.getState();
  if (activeLesson?.id === lessonId) return activeLesson;
  if (agentTarget?.lesson?.id === lessonId) return agentTarget.lesson;
  try {
    const fetched = await client.course.getLesson.fetch({ courseId, lessonId });
    return { id: fetched.id, title: fetched.title };
  } catch {
    return undefined;
  }
}

export async function applyCourseDelta(
  delta: CourseDelta,
  deps: CourseDeltaDeps,
): Promise<void> {
  maybeOpenStudio(deps);
  const { client } = deps;
  const builder = () => useCourseBuilderStore.getState();

  switch (delta.type) {
    case "course-created": {
      builder().agentTouched({ course: delta.course });
      return;
    }

    case "lesson-created":
    case "lesson-updated": {
      void client.course.listLessons.invalidate({ courseId: delta.courseId });
      const course = await resolveCourse(delta.courseId, client);
      if (!course) return;
      builder().agentTouched({
        course,
        lesson: delta.lesson,

        scene: delta.type === "lesson-created" ? delta.scene : undefined,
      });
      return;
    }

    case "lessons-reordered": {
      void client.course.listLessons.invalidate({ courseId: delta.courseId });
      return;
    }

    case "lesson-deleted": {
      applyCourseBuilderDeletionEffects({
        kind: "lesson",
        deletedIds: [delta.lessonId],
        courseId: delta.courseId,
        utils: client,
      });
      return;
    }

    case "scene-created":
    case "scene-updated": {
      invalidateCourseSceneState(client, {
        courseId: delta.courseId,
        lessonIds: [delta.lessonId],
      });
      const course = await resolveCourse(delta.courseId, client);
      if (!course) return;
      const lesson = await resolveLesson(
        delta.courseId,
        delta.lessonId,
        client,
      );
      if (!lesson) return;
      builder().agentTouched({ course, lesson, scene: delta.scene });
      return;
    }

    case "scenes-reordered": {
      invalidateCourseSceneState(client, {
        courseId: delta.courseId,
        lessonIds: [delta.lessonId],
      });
      return;
    }

    case "scene-deleted": {
      applyCourseBuilderDeletionEffects({
        kind: "scene",
        deletedIds: [delta.sceneId],
        courseId: delta.courseId,
        lessonIds: [delta.lessonId],
        utils: client,
      });
      return;
    }

    case "invalidation-updated": {
      invalidateCourseSceneState(client, {
        courseId: delta.courseId,
        lessonIds: delta.lessonIds,
        allLessons: !delta.lessonIds?.length,
      });
      return;
    }

    default:
      assertExhaustive(delta);
  }
}
