import type { DraggableAttributes } from "@dnd-kit/core";
import type { SortableSceneItemProps } from "./scene-list-item";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@scibly/ui/utils";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import * as React from "react";

import { SceneSourcesInfo } from "@/shared/content/course/components/scene-sources-info";

import { SceneIcon } from "./scene-icon";

export type { SceneListItem } from "./scene-list-item";

interface SceneItemCardProps extends SortableSceneItemProps {
  isDragging?: boolean;
  isOverlay?: boolean;
  className?: string;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  attributes?: DraggableAttributes;
  listeners?: ReturnType<typeof useSortable>["listeners"];

  ref?: React.Ref<HTMLDivElement>;
}

function sceneItemStateClassName(isActive: boolean, compact: boolean): string {
  if (isActive && compact) {
    return "border-[#b9d7ff] bg-[#eff5ff] dark:border-blue-800/50 dark:bg-blue-900/20";
  }
  if (isActive) {
    return "border-hairline bg-white shadow-[0_2px_0_0_var(--color-lip)] dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none";
  }
  if (compact) {
    return "hover:bg-ground-soft border-transparent bg-transparent dark:hover:bg-neutral-800/30";
  }
  return "hover:border-hairline hover:bg-ground-soft border-transparent bg-transparent dark:hover:border-neutral-700/50 dark:hover:bg-neutral-800/50";
}

function sceneIconStateClassName(isActive: boolean, compact: boolean): string {
  if (isActive && compact) {
    return "bg-[#dcebff] text-[#0b52cc] dark:bg-blue-900/50 dark:text-blue-400";
  }
  if (isActive) {
    return "bg-[#eff5ff] text-[#0b52cc] dark:bg-blue-500/10 dark:text-blue-400";
  }
  if (compact) {
    return "bg-ground text-ink-faint dark:bg-neutral-800/60 dark:text-neutral-500";
  }
  return "bg-ground text-ink-soft dark:bg-neutral-800 dark:text-neutral-400";
}

function withDefaultLabel(value: string | undefined, fallback: string): string {
  return value === undefined ? fallback : value;
}

export const ScenePosition = ({
  compact,
  index,
  isActive,
}: Pick<SceneItemCardProps, "compact" | "index" | "isActive">) => {
  return (
    <div
      className={cn(
        "text-center font-bold",
        compact ? "w-4 text-[10px]" : "w-5 text-[11px]",
        isActive
          ? "text-[#0b52cc] dark:text-blue-400"
          : "text-ink-faint font-medium dark:text-neutral-500",
      )}
    >
      {index + 1}
    </div>
  );
};

export const SceneTypeIcon = ({
  compact,
  isActive,
  scene,
}: Pick<SceneItemCardProps, "compact" | "isActive" | "scene">) => {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center transition-colors",
        compact ? "h-6 w-6 rounded-md" : "h-8 w-8 rounded-full",
        sceneIconStateClassName(isActive, compact ?? false),
      )}
    >
      <SceneIcon
        kind={scene.kind}
        className={compact ? "h-3 w-3" : "h-4 w-4"}
      />
    </div>
  );
};

function getSceneDetailsLabels(props: SceneItemCardProps) {
  const isPractice = props.scene.kind === "PRACTICE";
  return {
    interactiveCanvasLabel: withDefaultLabel(
      isPractice ? props.practiceSceneLabel : props.interactiveCanvasLabel,
      isPractice ? "Practice app" : "Interactive canvas",
    ),
    sceneOutdatedLabel: withDefaultLabel(
      props.sceneOutdatedLabel,
      "Source material changed",
    ),
    sourcesLabel: withDefaultLabel(props.sourcesLabel, "Sources"),
  };
}

export const SceneDetails = (props: SceneItemCardProps) => {
  const { compact, hideOutdatedIndicators, isActive, scene } = props;
  const { interactiveCanvasLabel, sceneOutdatedLabel, sourcesLabel } =
    getSceneDetailsLabels(props);

  return (
    <div className={cn("flex min-w-0 flex-1", compact ? "" : "ml-2 flex-col")}>
      <div className="flex min-w-0 items-center gap-1">
        <span
          className={cn(
            "truncate leading-tight font-medium",
            compact ? "text-[11px]" : "text-[13px] font-semibold",
            isActive
              ? "text-ink dark:text-neutral-100"
              : "text-ink-muted dark:text-neutral-400",
          )}
        >
          {scene.title}
        </span>
        {scene.isOutdated && !hideOutdatedIndicators ? (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            title={sceneOutdatedLabel}
          />
        ) : null}
      </div>
      {compact ? null : scene.sources.length > 0 ? (
        <SceneSourcesInfo
          sources={scene.sources}
          label={sourcesLabel}
          className="mt-1"
        />
      ) : (
        <span className="text-ink-faint mt-0.5 text-[11px] dark:text-neutral-500">
          {interactiveCanvasLabel}
        </span>
      )}
    </div>
  );
};

function getSceneActionLabels(props: SceneItemCardProps) {
  return {
    deleteSceneLabel: withDefaultLabel(props.deleteSceneLabel, "Delete scene"),
    duplicateSceneLabel: withDefaultLabel(
      props.duplicateSceneLabel,
      "Duplicate scene",
    ),
  };
}

export const SceneActions = (props: SceneItemCardProps) => {
  const { canDelete, compact, onClone, onDelete } = props;
  const { deleteSceneLabel, duplicateSceneLabel } = getSceneActionLabels(props);

  return (
    <div className="pointer-events-none absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center rounded-[8px] bg-inherit pl-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
      {onClone ? (
        <button
          type="button"
          onClick={onClone}
          title={duplicateSceneLabel}
          className={cn(
            "text-ink-faint hover:bg-ground hover:text-ink rounded-md transition-colors dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
            compact ? "p-1" : "p-1.5",
          )}
        >
          <Copy className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          title={deleteSceneLabel}
          className={cn(
            "text-ink-faint rounded-md transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10",
            compact ? "p-1" : "p-1.5",
          )}
        >
          <Trash2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </button>
      ) : null}
    </div>
  );
};

function setSceneItemRefs(
  node: HTMLDivElement | null,
  ref: SceneItemCardProps["ref"],
  setNodeRef: SceneItemCardProps["setNodeRef"],
) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
  setNodeRef?.(node);
}

export function SceneItemCard(props: SceneItemCardProps) {
  const {
    attributes,
    className,
    compact = false,
    isActive,
    isDragging = false,
    isOverlay = false,
    listeners,
    onClick,
    ref,
    setNodeRef,
    style,
  } = props;

  return (
    <div
      ref={(node) => setSceneItemRefs(node, ref, setNodeRef)}
      style={style}
      onClick={onClick}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex cursor-grab items-center active:cursor-grabbing",
        !isDragging && !isOverlay ? "transition-all" : undefined,
        "border-2",
        compact ? "gap-1.5 rounded-[10px] p-1.5" : "gap-2 rounded-xl p-2",
        sceneItemStateClassName(isActive, compact),
        isDragging ? "scale-95 opacity-20 grayscale" : undefined,
        className,
      )}
    >
      <GripVertical
        className={cn(
          "text-ink-faint shrink-0 opacity-0 transition-opacity group-hover:opacity-100 dark:text-neutral-600",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
        )}
      />
      <ScenePosition
        compact={compact}
        index={props.index}
        isActive={isActive}
      />
      <SceneTypeIcon
        compact={compact}
        isActive={isActive}
        scene={props.scene}
      />
      <SceneDetails {...props} />
      <SceneActions {...props} />
    </div>
  );
}

export function SortableSceneItem(props: SortableSceneItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SceneItemCard
      {...props}
      setNodeRef={setNodeRef}
      style={style}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );
}
