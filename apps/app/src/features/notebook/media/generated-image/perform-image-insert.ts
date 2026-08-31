"use client";

import type { api } from "@/shared/api/trpc/client";
import type { ImageInsertTarget } from "./insert-target-storage";
import type { InsertGeneratedImageLabels } from "./use-generated-image-actions";

import { toast } from "sonner";

import { vanillaApi } from "@/shared/api/trpc/client";

import { useCourseBuilderStore } from "../../course-builder/course-builder-store";
import { openSceneInCourseBuilder } from "../../course-builder/hooks/open-scene-in-course-builder";
import {
  clearStoredImageInsertTarget,
  getStoredImageInsertTarget,
  setStoredImageInsertTarget,
} from "./insert-target-storage";

type Utils = ReturnType<typeof api.useUtils>;

export function resolveInsertTarget(
  notebookId: string | undefined,
  targets: ImageInsertTarget[],
): ImageInsertTarget | null | "picker" {
  const { activeScene, activeLesson } = useCourseBuilderStore.getState();

  if (notebookId) {
    const stored = getStoredImageInsertTarget(notebookId);
    if (stored) return stored;
  }

  if (activeScene && activeLesson) {
    return {
      sceneId: activeScene.id,
      sceneTitle: activeScene.title,
      lessonId: activeLesson.id,
      lessonTitle: activeLesson.title,
    };
  }

  if (targets.length === 1) return targets[0] ?? null;
  if (targets.length > 1) return "picker";
  return null;
}

export function clearInsertTargetIfSceneChanged(
  notebookId: string | undefined,
  activeSceneId: string | undefined,
) {
  if (!notebookId || !activeSceneId) return;
  const stored = getStoredImageInsertTarget(notebookId);
  if (stored && stored.sceneId !== activeSceneId) {
    clearStoredImageInsertTarget(notebookId);
  }
}

export async function performImageInsert({
  url,
  target,
  utils,
  insertLabels,
  notebookId,
  invalidateMediaLibrary,
}: {
  url: string;
  target: ImageInsertTarget;
  utils: Utils;
  insertLabels: InsertGeneratedImageLabels;
  notebookId: string | undefined;
  invalidateMediaLibrary: () => void;
}): Promise<boolean> {
  const { course: activeCourse } = useCourseBuilderStore.getState();

  if (!activeCourse) {
    toast.error(insertLabels.noCourseLinked);
    return false;
  }

  await openSceneInCourseBuilder(utils, {
    courseId: activeCourse.id,
    courseTitle: activeCourse.title,
    lesson: { id: target.lessonId, title: target.lessonTitle },
    scene: { id: target.sceneId, title: target.sceneTitle },
  });

  // No `alt`: the editor's image block has no such attribute, so it would be dropped.
  try {
    await vanillaApi.scene.writeSceneContent.mutate({
      sceneId: target.sceneId,
      html: `<img src="${url.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">`,
      mode: "append",
    });
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : insertLabels.insertError,
    );
    return false;
  }

  if (notebookId) {
    setStoredImageInsertTarget(notebookId, target);
  }

  toast.success(
    insertLabels.insertedIntoScene
      .replace("{{scene}}", target.sceneTitle)
      .replace("{{lesson}}", target.lessonTitle),
  );
  invalidateMediaLibrary();
  return true;
}
