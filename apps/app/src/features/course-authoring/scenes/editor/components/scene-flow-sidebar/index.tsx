"use client";

import {
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@scibly/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useSceneListLocalMutations } from "@/features/course-authoring/scenes/editor/hooks/use-scene-list-local-mutations";
import { SortableSceneItem } from "@/shared/content/course/components/scene-list/sortable-scene-item";
import { useSceneDnd } from "@/shared/content/course/hooks/use-scene-dnd";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";
import { useSaveState } from "@/shared/ui/hooks/use-save-state";

import { type Scene } from "../../../../lessons/builder/components/lesson-builder";

interface SceneFlowSidebarProps {
  lessonId: string;
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
}

export const SceneSortableList = ({
  scenes,
  activeSceneId,
  drag,
  onSelect,
  onClone,
  onDelete,
}: {
  scenes: Scene[];
  activeSceneId: string;
  drag: ReturnType<typeof useSceneDnd<Scene>>;
  onSelect: (id: string) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <DndContext
      id="scene-flow-dnd-context"
      sensors={drag.sensors}
      collisionDetection={closestCorners}
      onDragStart={drag.handleDragStart}
      onDragEnd={drag.handleDragEnd}
    >
      <SortableContext
        items={scenes.map((scene) => scene.id)}
        strategy={verticalListSortingStrategy}
      >
        {scenes.map((scene, index) => (
          <SortableSceneItem
            key={scene.id}
            scene={scene}
            index={index}
            isActive={scene.id === activeSceneId}
            onClick={() => onSelect(scene.id)}
            onClone={(event) => {
              event.stopPropagation();
              onClone(scene.id);
            }}
            onDelete={(event) => {
              event.stopPropagation();
              onDelete(scene.id);
            }}
            canDelete={scenes.length > 1}
          />
        ))}
      </SortableContext>
      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: "0.5" } },
          }),
        }}
      >
        {drag.dragActiveId ? (
          <SortableSceneItem
            scene={scenes.find((scene) => scene.id === drag.dragActiveId)!}
            index={scenes.findIndex((scene) => scene.id === drag.dragActiveId)}
            isActive={drag.dragActiveId === activeSceneId}
            onClick={() => {}}
            onDelete={() => {}}
            canDelete={false}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export const SceneListHeader = ({ onCreate }: { onCreate: () => void }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <h2 className="text-ink-faint text-[11px] font-bold tracking-wider uppercase">
        Scenes
      </h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCreate}
        className="hover:bg-ground h-6 w-6 rounded-[8px] dark:hover:bg-neutral-800"
      >
        <Plus className="text-ink-muted h-4 w-4" />
      </Button>
    </div>
  );
};

export function SceneFlowSidebar({
  lessonId,
  scenes,
  setScenes,
  activeSceneId,
  setActiveSceneId,
}: SceneFlowSidebarProps) {
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);

  const addSave = useSaveState((state) => state.addSave);
  const removeSave = useSaveState((state) => state.removeSave);

  const {
    createScene: { mutate: createSceneMutation },
    cloneScene: { mutate: cloneSceneMutation },
    deleteScene: { mutate: deleteSceneMutation, isPending: isDeletingScene },
    reorderScenes: { mutate: reorderScenesMutation },
  } = useSceneListLocalMutations({
    scenes,
    setScenes,
    activeSceneId,
    setActiveSceneId,
    saveState: { start: addSave, end: removeSave },
    onDeleteFailed: (message) => {
      toast.error(message || "Failed to delete scene.");
    },
    onDeleteSuccess: () => setSceneToDelete(null),
  });

  const drag = useSceneDnd({
    items: scenes,
    onReorder: (reordered) => {
      setScenes(reordered);
      reorderScenesMutation({
        lessonId,
        sceneIds: reordered.map((scene) => scene.id),
      });
    },
  });

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-white pt-2 dark:bg-neutral-950">
      <SceneListHeader onCreate={() => createSceneMutation({ lessonId })} />

      <div className="no-scrollbar flex-1 overflow-y-auto px-2 pb-4">
        <SceneSortableList
          scenes={scenes}
          activeSceneId={activeSceneId}
          drag={drag}
          onSelect={setActiveSceneId}
          onClone={(sceneId) => cloneSceneMutation({ sceneId })}
          onDelete={setSceneToDelete}
        />
      </div>

      <ConfirmDeleteDialog
        open={!!sceneToDelete}
        title="Delete Scene"
        description="Are you sure you want to delete this scene? This action cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Delete"
        isConfirming={isDeletingScene}
        onCancel={() => setSceneToDelete(null)}
        onConfirm={() => {
          if (sceneToDelete) {
            deleteSceneMutation({ sceneIds: [sceneToDelete] });
          }
        }}
      />
    </aside>
  );
}
