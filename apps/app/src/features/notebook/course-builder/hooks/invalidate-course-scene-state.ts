"use client";

import type { CourseBuilderQueryClient } from "./builder-query-client";

import {
  type CourseEntity,
  useCourseBuilderStore,
} from "../course-builder-store";

type Utils = CourseBuilderQueryClient;

interface InvalidateCourseSceneStateOptions {
  courseId?: string;

  lessonIds?: string[];

  allLessons?: boolean;
}

export function invalidateCourseSceneState(
  utils: Utils,
  { courseId, lessonIds, allLessons }: InvalidateCourseSceneStateOptions,
): void {
  if (courseId) {
    void utils.course.getOutdatedScenes.invalidate({ courseId });
  }

  if (allLessons) {
    void utils.scene.getLessonScenes.invalidate();
    return;
  }

  if (lessonIds?.length) {
    for (const lessonId of new Set(lessonIds)) {
      void utils.scene.getLessonScenes.invalidate({ lessonId });
    }
  }
}

const LESSON_LIST_LIMIT = 100;

interface DeletionRepairNotice {
  kind: "scene" | "lesson";

  deleted: CourseEntity;

  movedTo: CourseEntity | undefined;
}

// Falls back to the nearest surviving item instead of clearing the selection,
// so a deletion doesn't reset the author's place in the list.
function nearestSurvivor(
  items: readonly CourseEntity[] | undefined,
  deletedIds: ReadonlySet<string>,
  fromId: string,
): CourseEntity | undefined {
  if (!items?.length) return undefined;
  const index = items.findIndex((item) => item.id === fromId);
  if (index === -1) return undefined;
  const survives = (item: CourseEntity) => !deletedIds.has(item.id);
  return (
    items.slice(index + 1).find(survives) ??
    [...items.slice(0, index)].reverse().find(survives)
  );
}

interface ApplyCourseBuilderDeletionEffectsOptions {
  kind: "scene" | "lesson";
  deletedIds: string[];
  courseId: string;

  lessonIds?: string[];
  utils: Utils;

  notify?: (notice: DeletionRepairNotice) => void;
}

// The only hook the builder gets for a deletion: deletions never arrive as
// course deltas.
export function applyCourseBuilderDeletionEffects({
  kind,
  deletedIds,
  courseId,
  lessonIds,
  utils,
  notify,
}: ApplyCourseBuilderDeletionEffectsOptions): void {
  const deletedIdSet = new Set(deletedIds);
  const { activeLesson, activeScene, setActiveLesson, setActiveScene } =
    useCourseBuilderStore.getState();

  if (kind === "lesson") {
    if (activeLesson && deletedIdSet.has(activeLesson.id)) {
      const movedTo = nearestSurvivor(
        utils.course.listLessons.getData({ courseId, limit: LESSON_LIST_LIMIT })
          ?.items,
        deletedIdSet,
        activeLesson.id,
      );

      setActiveLesson(movedTo, "system");
      notify?.({ kind, deleted: activeLesson, movedTo });
    }

    for (const lessonId of deletedIdSet) {
      void utils.scene.getLessonScenes.cancel({ lessonId });
    }

    void utils.course.listLessons.invalidate({ courseId });
    invalidateCourseSceneState(utils, {
      courseId,
      lessonIds: [...deletedIdSet],
    });
    return;
  }

  if (activeScene && deletedIdSet.has(activeScene.id)) {
    const movedTo = activeLesson
      ? nearestSurvivor(
          utils.scene.getLessonScenes.getData({ lessonId: activeLesson.id }),
          deletedIdSet,
          activeScene.id,
        )
      : undefined;
    setActiveScene(movedTo, "system");
    notify?.({ kind, deleted: activeScene, movedTo });
  }

  if (lessonIds?.length) {
    for (const lessonId of new Set(lessonIds)) {
      void utils.scene.getLessonScenes.cancel({ lessonId });
    }
  }

  invalidateCourseSceneState(utils, {
    courseId,
    lessonIds,
  });
}
