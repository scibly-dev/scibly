"use client";

import type { RouterOutputs } from "@/shared/api/trpc/contracts";
import type { DeletionInvocation, DeletionResolution } from "./deletion.types";

import { api } from "@/shared/api/trpc/client";

import { useCourseBuilderStore } from "../../../course-builder/course-builder-store";

type SceneData = RouterOutputs["scene"]["resolveSceneDeletion"] | undefined;
type LessonData = RouterOutputs["course"]["resolveLessonDeletion"] | undefined;

export function useDeletionResolution(invocation: DeletionInvocation) {
  const isScene = invocation.kind === "scene";
  const isOpen = invocation.status === "awaiting-approval";

  const scenes = api.scene.resolveSceneDeletion.useQuery(
    { sceneIds: invocation.ids },
    { enabled: isOpen && isScene },
  );
  const lessons = api.course.resolveLessonDeletion.useQuery(
    { lessonIds: invocation.ids },
    { enabled: isOpen && !isScene },
  );

  const builderCourseId = useCourseBuilderStore((state) => state.course?.id);

  return {
    isResolving: isOpen && (isScene ? scenes : lessons).isPending,
    resolution: toResolution(invocation, scenes.data, lessons.data),
    isCourseOpenInBuilder: builderCourseId === invocation.courseId,
  };
}

function usable(
  invocation: DeletionInvocation,
  data: { course: { id: string }; missing: string[] } | null | undefined,
): boolean {
  return (
    data != null &&
    data.missing.length === 0 &&
    data.course.id === invocation.courseId
  );
}

function toResolution(
  invocation: DeletionInvocation,
  scenes: SceneData,
  lessons: LessonData,
): DeletionResolution | null {
  if (invocation.kind === "scene") {
    if (!scenes || !usable(invocation, scenes)) return null;
    const first = scenes.found[0]!;
    return {
      courseTitle: scenes.course.title,
      items: scenes.found.map((scene) => ({
        id: scene.sceneId,
        title: scene.sceneTitle,
        subtitle: scene.lessonTitle || undefined,
        lessonId: scene.lessonId,
      })),
      focusLesson: { id: first.lessonId, title: first.lessonTitle },
    };
  }

  if (!lessons || !usable(invocation, lessons)) return null;
  const only = lessons.found.length === 1 ? lessons.found[0]! : undefined;
  return {
    courseTitle: lessons.course.title,
    items: lessons.found.map((lesson) => ({
      id: lesson.lessonId,
      title: lesson.lessonTitle,
    })),
    focusLesson: only && { id: only.lessonId, title: only.lessonTitle },
  };
}
