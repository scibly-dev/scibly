"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";

import { api } from "@/shared/api/trpc/client";

type LessonScene = RouterOutputs["scene"]["getLessonScenes"][number];

interface SceneListLocalMutationsOptions {
  scenes: LessonScene[];
  setScenes: (scenes: LessonScene[]) => void;
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
  saveState: {
    start: () => void;
    end: () => void;
  };
  onDeleteFailed?: (message: string) => void;
  onDeleteSuccess?: () => void;
}

function useCreateScene(options: SceneListLocalMutationsOptions) {
  return api.scene.createScene.useMutation({
    onMutate: () => options.saveState.start(),
    onSuccess: (newScene) => {
      options.setScenes([...options.scenes, newScene]);
      options.setActiveSceneId(newScene.id);
    },
    onError: console.error,
    onSettled: () => options.saveState.end(),
  });
}

function useCloneScene(options: SceneListLocalMutationsOptions) {
  return api.scene.cloneScene.useMutation({
    onMutate: ({ sceneId }) => {
      options.saveState.start();
      const sourceIndex = options.scenes.findIndex(
        (scene) => scene.id === sceneId,
      );
      return {
        previousScenes: options.scenes,
        sourceIndex,
        sourceSceneId: sceneId,
      };
    },
    onSuccess: (clonedScene, variables, context) => {
      const sourceIndex =
        context?.sourceIndex ??
        options.scenes.findIndex((scene) => scene.id === variables.sceneId);
      const nextScenes = [...options.scenes];
      nextScenes.splice(
        sourceIndex >= 0 ? sourceIndex + 1 : options.scenes.length,
        0,
        clonedScene,
      );
      options.setScenes(
        nextScenes.map((scene, order) => ({ ...scene, order })),
      );
      options.setActiveSceneId(clonedScene.id);
    },
    onError: (error, variables, context) => {
      console.error("Failed to clone scene", {
        sceneId: variables.sceneId,
        error,
      });
      if (context) options.setScenes(context.previousScenes);
    },
    onSettled: () => options.saveState.end(),
  });
}

function useDeleteScene(options: SceneListLocalMutationsOptions) {
  return api.scene.deleteScene.useMutation({
    onMutate: ({ sceneIds }) => {
      options.saveState.start();
      const ids = new Set(sceneIds);
      const nextScenes = options.scenes.filter((scene) => !ids.has(scene.id));
      options.setScenes(nextScenes);
      if (
        options.activeSceneId &&
        ids.has(options.activeSceneId) &&
        nextScenes.length > 0
      )
        options.setActiveSceneId(nextScenes[0]!.id);
      return {
        previousScenes: options.scenes,
        previousActiveId: options.activeSceneId,
      };
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        if (context) {
          options.setScenes(context.previousScenes);
          options.setActiveSceneId(context.previousActiveId);
        }
        options.onDeleteFailed?.(
          `${result.message} (sceneIds: ${variables.sceneIds.join(", ")})`,
        );
        return;
      }
      options.onDeleteSuccess?.();
    },
    onError: (error, variables, context) => {
      console.error("Failed to delete scenes", {
        sceneIds: variables.sceneIds,
        error,
      });
      if (context) {
        options.setScenes(context.previousScenes);
        options.setActiveSceneId(context.previousActiveId);
      }
      options.onDeleteFailed?.(error.message);
    },
    onSettled: () => options.saveState.end(),
  });
}

export function useSceneListLocalMutations(
  options: SceneListLocalMutationsOptions,
) {
  const createScene = useCreateScene(options);
  const cloneScene = useCloneScene(options);
  const deleteScene = useDeleteScene(options);

  const reorderScenes = api.scene.reorderScenes.useMutation({
    onMutate: () => {
      options.saveState.start();
      return { previousScenes: options.scenes };
    },
    onError: (err, variables, context) => {
      console.error("Failed to reorder scenes", {
        lessonId: variables.lessonId,
        error: err,
      });
      if (context) options.setScenes(context.previousScenes);
    },
    onSettled: () => options.saveState.end(),
  });

  return {
    createScene,
    cloneScene,
    deleteScene,
    reorderScenes,
  };
}
