import { SceneAnimation } from "@scibly/db/enums";

import { type Scene } from "../../../../lessons/builder/components/lesson-builder";
import { useSceneTabController } from "../../hooks/use-scene-tab-controller";
import { SceneTabFields } from "./scene-tab-fields";

export function SceneTab({
  scene,
  onSceneUpdate,
}: {
  scene: Scene;
  onSceneUpdate: (id: string, updates: Partial<Scene>) => void;
}) {
  const controller = useSceneTabController(scene, onSceneUpdate);
  const currentAnimation = scene.animation || SceneAnimation.FADE;

  return (
    <div key={scene.id} className="flex flex-col gap-8 p-6">
      <SceneTabFields
        title={controller.title}
        animation={currentAnimation}
        spInput={controller.spInput}
        sceneSp={scene.sp}
        blockSp={controller.blockSp}
        availableSp={controller.availableSp}
        onTitleChange={controller.handleTitleChange}
        onSpChange={controller.handleSpChange}
        onAnimationChange={(animation) => controller.update({ animation })}
      />
    </div>
  );
}
