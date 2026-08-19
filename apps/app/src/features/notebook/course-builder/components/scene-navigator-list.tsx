"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";
import type {
  SceneNavigatorActions,
  SceneNavigatorItem,
} from "./scene-navigator-view";

import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Loader2, Plus } from "lucide-react";
import { createPortal } from "react-dom";

import {
  SceneItemCard,
  SortableSceneItem,
} from "@/shared/content/course/components/scene-list/sortable-scene-item";
import { type useSceneDnd } from "@/shared/content/course/hooks/use-scene-dnd";

export const DragPreview = ({
  scenes,
  dragActiveId,
  activeSceneId,
}: {
  scenes: readonly SceneNavigatorItem[];
  dragActiveId: string | null;
  activeSceneId?: string;
}) => {
  if (typeof document === "undefined") return null;
  const scene = scenes.find((item) => item.id === dragActiveId);
  if (!dragActiveId || !scene) return null;
  return createPortal(
    <DragOverlay dropAnimation={null}>
      <SceneItemCard
        scene={scene}
        index={scenes.findIndex((item) => item.id === dragActiveId)}
        isActive={dragActiveId === activeSceneId}
        onClick={() => undefined}
        onDelete={() => undefined}
        canDelete={false}
        isOverlay
        className="w-[228px]"
      />
    </DragOverlay>,
    document.body,
  );
};

interface SceneNavigatorListProps {
  scenes: readonly SceneNavigatorItem[];
  activeSceneId?: string;
  loading: boolean;
  actions?: SceneNavigatorActions;
  drag: ReturnType<typeof useSceneDnd<SceneNavigatorItem>>;
  cb: NotebookTranslations["studio"]["courseBuilder"];
  hideOutdated: boolean;
  onSelect: (scene: { id: string; title: string }) => void;
  onDelete: (id: string) => void;
}

export const AddSceneButton = ({
  actions,
  cb,
  count,
}: {
  actions: SceneNavigatorActions;
  cb: NotebookTranslations["studio"]["courseBuilder"];
  count: number;
}) => {
  return (
    <button
      type="button"
      id="course-builder-add-scene"
      disabled={actions.isCreating}
      onClick={() =>
        actions.create(cb.sceneLabel.replace("{n}", String(count + 1)))
      }
      className="border-edge text-ink-faint hover:text-ink-muted mt-1 flex w-full items-center justify-center gap-1 rounded-[10px] border-2 border-dashed py-1.5 text-[10px] font-semibold transition-colors hover:border-[#b9d7ff] hover:bg-[#eff5ff] disabled:opacity-40 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50"
    >
      <Plus className="h-3 w-3" />
      {cb.addScene}
    </button>
  );
};

export const SceneItems = ({ props }: { props: SceneNavigatorListProps }) => {
  return (
    <SortableContext
      items={props.scenes.map((scene) => scene.id)}
      strategy={verticalListSortingStrategy}
    >
      {props.scenes.map((scene, index) => (
        <SortableSceneItem
          key={scene.id}
          scene={scene}
          index={index}
          isActive={scene.id === props.activeSceneId}
          compact
          sourcesLabel={props.cb.sceneSources}
          duplicateSceneLabel={props.cb.duplicateScene}
          deleteSceneLabel={props.cb.deleteScene}
          sceneOutdatedLabel={props.cb.sceneOutdatedHint}
          interactiveCanvasLabel={props.cb.interactiveCanvas}
          hideOutdatedIndicators={props.hideOutdated}
          onClick={() => props.onSelect({ id: scene.id, title: scene.title })}
          onClone={
            props.actions
              ? (event) => {
                  event.stopPropagation();
                  props.actions?.clone(scene.id);
                }
              : undefined
          }
          onDelete={
            props.actions
              ? (event) => {
                  event.stopPropagation();
                  props.onDelete(scene.id);
                }
              : () => undefined
          }
          canDelete={Boolean(props.actions) && props.scenes.length > 1}
        />
      ))}
    </SortableContext>
  );
};

export function SceneNavigatorList(props: SceneNavigatorListProps) {
  if (props.loading)
    return (
      <div className="flex items-center justify-center py-3">
        <div className="animate-spin">
          <Loader2 className="text-ink-faint h-4 w-4" />
        </div>
      </div>
    );
  return (
    <>
      <DndContext
        id="notebook-scene-dnd"
        sensors={props.drag.sensors}
        collisionDetection={closestCorners}
        onDragStart={props.actions ? props.drag.handleDragStart : undefined}
        onDragEnd={props.actions ? props.drag.handleDragEnd : undefined}
      >
        <SceneItems props={props} />
        {props.actions ? (
          <DragPreview
            scenes={props.scenes}
            dragActiveId={props.drag.dragActiveId}
            activeSceneId={props.activeSceneId}
          />
        ) : null}
      </DndContext>
      {props.actions ? (
        <AddSceneButton
          actions={props.actions}
          cb={props.cb}
          count={props.scenes.length}
        />
      ) : null}
    </>
  );
}
