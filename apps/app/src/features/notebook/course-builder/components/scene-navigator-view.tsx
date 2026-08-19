"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import { type SceneListItem } from "@/shared/content/course/components/scene-list/sortable-scene-item";
import { useSceneDnd } from "@/shared/content/course/hooks/use-scene-dnd";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";

import { useEnsureValidSelection } from "../hooks/use-ensure-valid-selection";
import { SceneNavigatorList } from "./scene-navigator-list";

export type SceneNavigatorItem = SceneListItem;

export type SceneNavigatorActions = {
  create: (title: string) => void;
  clone: (sceneId: string) => void;
  delete: (sceneId: string) => Promise<boolean>;
  reorder: (sceneIds: string[]) => void;
  isCreating: boolean;
  isDeleting: boolean;
};

type SceneNavigatorViewProps = {
  t: NotebookTranslations;
  activeLessonId?: string;
  activeSceneId?: string;
  scenes: readonly SceneNavigatorItem[];
  isScenesLoading: boolean;
  onSelectScene: (scene: { id: string; title: string } | undefined) => void;

  onRepairSelection?: (
    scene: { id: string; title: string } | undefined,
  ) => void;
  outdatedIndicators: "visible" | "hidden";
} & (
  | { mode: "readonly"; actions?: never }
  | { mode: "editable"; actions: SceneNavigatorActions }
);

export const EmptyScenes = ({
  actions,
  cb,
}: {
  actions: SceneNavigatorActions | undefined;
  cb: NotebookTranslations["studio"]["courseBuilder"];
}) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-ink-faint text-sm dark:text-neutral-500">
        {cb.noScenesYet}
      </p>
      {actions ? (
        <Button
          size="sm"
          disabled={actions.isCreating}
          onClick={() => actions.create(cb.sceneLabel.replace("{n}", "1"))}
        >
          {actions.isCreating ? (
            <div className="mr-1.5 animate-spin">
              <Loader2 className="h-3.5 w-3.5" />
            </div>
          ) : (
            <Plus className="mr-1.5 h-3.5 w-3.5" />
          )}
          {cb.addScene}
        </Button>
      ) : null}
    </div>
  );
};

export const SceneSectionHeader = ({
  count,
  collapsed,
  onToggle,
  label,
}: {
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  label: string;
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between px-6 py-4"
    >
      <span className="text-ink-faint text-[10px] font-bold tracking-widest uppercase dark:text-neutral-500">
        {label}
      </span>
      <span className="text-ink-faint flex items-center gap-1 text-[10px] font-semibold">
        <span>{count}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            collapsed && "-rotate-90",
          )}
        />
      </span>
    </button>
  );
};

export const SceneDeleteDialog = ({
  sceneId,
  actions,
  cb,
  onClear,
}: {
  sceneId: string | null;
  actions?: SceneNavigatorActions;
  cb: NotebookTranslations["studio"]["courseBuilder"];
  onClear: () => void;
}) => {
  if (!actions) return null;
  return (
    <ConfirmDeleteDialog
      open={Boolean(sceneId)}
      title={cb.deleteSceneConfirmTitle}
      description={cb.deleteSceneConfirmDescription}
      cancelLabel={cb.cancel}
      confirmLabel={cb.confirmDelete}
      isConfirming={actions.isDeleting}
      onCancel={onClear}
      onConfirm={() => {
        if (!sceneId) return;
        void actions.delete(sceneId).then(
          (deleted) => {
            if (deleted) onClear();
          },
          () => undefined,
        );
      }}
    />
  );
};

export function SceneNavigatorView(props: SceneNavigatorViewProps) {
  const {
    t,
    activeLessonId,
    activeSceneId,
    scenes,
    isScenesLoading,
    onSelectScene,
    outdatedIndicators,
  } = props;
  const actions = props.mode === "editable" ? props.actions : undefined;
  const cb = t.studio.courseBuilder;
  const [collapsed, setCollapsed] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);
  const drag = useSceneDnd({
    items: scenes,
    onReorder: (reordered) =>
      actions?.reorder(reordered.map((scene) => scene.id)),
  });

  const repairSelection = props.onRepairSelection ?? onSelectScene;

  useEnsureValidSelection({
    items: scenes,
    activeId: activeSceneId,
    enabled: !isScenesLoading,
    setActive: (scene) =>
      repairSelection(scene ? { id: scene.id, title: scene.title } : undefined),
  });

  if (!activeLessonId) return null;

  if (scenes.length === 0 && !isScenesLoading) {
    return <EmptyScenes actions={actions} cb={cb} />;
  }

  return (
    <div className="flex h-full flex-col">
      <SceneSectionHeader
        count={scenes.length}
        collapsed={collapsed}
        onToggle={() => setCollapsed((previous) => !previous)}
        label={cb.scenes}
      />

      {!collapsed ? (
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
          <SceneNavigatorList
            scenes={scenes}
            activeSceneId={activeSceneId}
            loading={isScenesLoading}
            actions={actions}
            drag={drag}
            cb={cb}
            hideOutdated={outdatedIndicators === "hidden"}
            onSelect={onSelectScene}
            onDelete={setSceneToDelete}
          />
        </div>
      ) : null}

      <SceneDeleteDialog
        sceneId={sceneToDelete}
        actions={actions}
        cb={cb}
        onClear={() => setSceneToDelete(null)}
      />
    </div>
  );
}
