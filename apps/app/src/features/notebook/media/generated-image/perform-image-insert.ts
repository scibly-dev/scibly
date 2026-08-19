"use client";

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { api } from "@/shared/api/trpc/client";
import type { ImageInsertTarget } from "./insert-target-storage";
import type { InsertGeneratedImageLabels } from "./use-generated-image-actions";

import { toast } from "sonner";

import { performBackgroundInsertMediaNode } from "@/features/course-authoring/client";
import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";
import { insertMediaNodeAtEnd } from "@/shared/content/editor/media/utils/media";

import { useCourseBuilderStore } from "../../course-builder/course-builder-store";
import { openSceneInCourseBuilder } from "../../course-builder/hooks/open-scene-in-course-builder";
import {
  clearStoredImageInsertTarget,
  getStoredImageInsertTarget,
  setStoredImageInsertTarget,
} from "./insert-target-storage";

type Utils = ReturnType<typeof api.useUtils>;

type WebsocketProvider =
  HocuspocusProvider["configuration"]["websocketProvider"];

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
  alt,
  target,
  utils,
  insertLabels,
  notebookId,
  websocketProvider,
  invalidateMediaLibrary,
}: {
  url: string;
  alt: string;
  target: ImageInsertTarget;
  utils: Utils;
  insertLabels: InsertGeneratedImageLabels;
  notebookId: string | undefined;
  websocketProvider: WebsocketProvider | null | undefined;
  invalidateMediaLibrary: () => void;
}): Promise<boolean> {
  const { course: activeCourse, activeScene: currentScene } =
    useCourseBuilderStore.getState();

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

  const editor = useQuestionBlockStore.getState().editor;
  const isActiveScene = currentScene?.id === target.sceneId;

  if (editor && isActiveScene) {
    insertMediaNodeAtEnd(editor, url, alt);
  } else {
    if (!websocketProvider) {
      toast.error(insertLabels.insertError);
      return false;
    }

    const result = await performBackgroundInsertMediaNode({
      sceneId: target.sceneId,
      url,
      alt,
      websocketProvider,
    });

    if (!result.success) {
      toast.error(result.error ?? insertLabels.insertError);
      return false;
    }
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
