"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";

import {
  applyCourseBuilderDeletionEffects,
  invalidateCourseSceneState,
} from "@/features/notebook/course-builder/hooks/invalidate-course-scene-state";
import { api } from "@/shared/api/trpc/client";

export type LessonScene = RouterOutputs["scene"]["getLessonScenes"][number];

type TrpcUtils = ReturnType<typeof api.useUtils>;

function applyOptimisticSceneReorderInCache(
  utils: TrpcUtils,
  lessonId: string,
  sceneIds: string[],
): LessonScene[] | undefined {
  const previousScenes = utils.scene.getLessonScenes.getData({ lessonId });

  if (previousScenes) {
    const byId = new Map(previousScenes.map((scene) => [scene.id, scene]));
    const reordered = sceneIds
      .map((id) => byId.get(id))
      .filter((scene): scene is LessonScene => scene !== undefined);
    utils.scene.getLessonScenes.setData({ lessonId }, reordered);
  }

  return previousScenes;
}

interface SceneListCacheMutationsOptions {
  lessonId: string | undefined;
  courseId: string | undefined;
  setActiveScene: (scene: { id: string; title: string } | undefined) => void;
  onDeleteFailed: (message: string) => void;
  onDeleteSuccess?: () => void;
}

function handleDeletedScene(
  result:
    | {
        success: false;
        message: string;
        deleted: readonly { sceneId: string }[];
      }
    | { success: true; deleted: readonly { sceneId: string }[] },
  options: SceneListCacheMutationsOptions,
  utils: TrpcUtils,
) {
  if (!result.success) {
    options.onDeleteFailed(result.message);
    return;
  }
  if (options.courseId) {
    applyCourseBuilderDeletionEffects({
      kind: "scene",
      deletedIds: result.deleted.map((entry) => entry.sceneId),
      courseId: options.courseId,
      lessonIds: options.lessonId ? [options.lessonId] : undefined,
      utils,
    });
  }
  options.onDeleteSuccess?.();
}

export function useSceneListCacheMutations(
  options: SceneListCacheMutationsOptions,
) {
  const { lessonId, courseId, setActiveScene, onDeleteFailed } = options;
  const utils = api.useUtils();

  const invalidateScenes = () =>
    invalidateCourseSceneState(utils, {
      courseId,
      lessonIds: lessonId ? [lessonId] : undefined,
    });

  const createScene = api.scene.createScene.useMutation({
    onSuccess: invalidateScenes,
  });

  const deleteScene = api.scene.deleteScene.useMutation({
    onSuccess: (result) => handleDeletedScene(result, options, utils),
    onError: (err) => {
      onDeleteFailed(err.message);
    },
  });

  const cloneScene = api.scene.cloneScene.useMutation({
    onSuccess: (clonedScene) => {
      invalidateScenes();
      setActiveScene({ id: clonedScene.id, title: clonedScene.title });
    },
  });

  const reorderScenes = api.scene.reorderScenes.useMutation({
    onMutate: async (variables) => {
      await utils.scene.getLessonScenes.cancel({
        lessonId: variables.lessonId,
      });
      const previousScenes = applyOptimisticSceneReorderInCache(
        utils,
        variables.lessonId,
        variables.sceneIds,
      );
      return { previousScenes };
    },
    onError: (error, variables, context) => {
      console.error("Failed to reorder scenes", {
        lessonId: variables.lessonId,
        error,
      });
      if (context?.previousScenes) {
        utils.scene.getLessonScenes.setData(
          { lessonId: variables.lessonId },
          context.previousScenes,
        );
      }
    },
  });

  return {
    createScene,
    deleteScene,
    cloneScene,
    reorderScenes,
    invalidateScenes,
  };
}
