import type { Scene } from "../../../lessons/builder/components/lesson-builder";

import { useHocuspocusProvider } from "@hocuspocus/provider-react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { api } from "@/shared/api/trpc/client";
import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";
import { getCanvasSceneAvailableSp } from "@/shared/content/learning/scene-sp";
import { useSaveState } from "@/shared/ui/hooks/use-save-state";

export function useSceneTabController(
  scene: Scene,
  onSceneUpdate: (id: string, updates: Partial<Scene>) => void,
) {
  const [title, setTitle] = useState(scene.title);
  const [spInput, setSpInput] = useState(scene.sp || 0);
  const questionBlocks = useQuestionBlockStore((state) => state.questionBlocks);
  const blockSp = Array.from(questionBlocks.values()).reduce(
    (sum, block) => sum + (block.blockSp ?? 0),
    0,
  );
  const availableSp = getCanvasSceneAvailableSp(scene.sp, blockSp);
  const addSave = useSaveState((state) => state.addSave);
  const removeSave = useSaveState((state) => state.removeSave);
  const provider = useHocuspocusProvider();
  const { mutate } = api.scene.updateScene.useMutation({
    onMutate: ({ sceneId, updates }) => {
      addSave();
      const { integration, ...rest } = updates ?? {};
      const optimistic: Partial<Scene> = rest;

      if (integration !== undefined) {
        optimistic.integration = integration ?? undefined;
      }
      onSceneUpdate(sceneId, optimistic);
      return { previousScene: scene };
    },
    onSuccess: (_, variables) =>
      provider.sendStateless(
        JSON.stringify({
          type: "update_scene",
          sceneId: variables.sceneId,
          updates: variables.updates,
        }),
      ),
    onError: (error, variables, context) => {
      console.error(error);
      if (context) onSceneUpdate(variables.sceneId, context.previousScene);
    },
    onSettled: removeSave,
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setTitle(scene.title);
      setSpInput(scene.sp || 0);
    }, 0);
    return () => clearTimeout(timer);
  }, [scene.id, scene.sp, scene.title]);
  const updateTitle = useDebouncedCallback(
    (value: string) => mutate({ sceneId: scene.id, updates: { title: value } }),
    500,
  );
  const updateSp = useDebouncedCallback(
    (value: number) => mutate({ sceneId: scene.id, updates: { sp: value } }),
    500,
  );
  return {
    title,
    spInput,
    blockSp,
    availableSp,
    update: (updates: Partial<Scene>) => mutate({ sceneId: scene.id, updates }),
    handleTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(event.target.value);
      onSceneUpdate(scene.id, { title: event.target.value });
      updateTitle(event.target.value);
    },
    handleSpChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value) || 0;
      setSpInput(value);
      onSceneUpdate(scene.id, { sp: value });
      updateSp(value);
    },
  };
}
