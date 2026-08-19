import type { SceneSourceInfo } from "@/shared/content/course/components/scene-sources-info";

export type SceneListItem = {
  id: string;
  title: string;
  isOutdated: boolean;
  sources: readonly SceneSourceInfo[];
};

export interface SortableSceneItemProps {
  scene: SceneListItem;
  isActive: boolean;
  index: number;
  onClick: () => void;
  onDelete: (event: React.MouseEvent) => void;
  onClone?: (event: React.MouseEvent) => void;
  canDelete: boolean;
  compact?: boolean;
  sourcesLabel?: string;
  duplicateSceneLabel?: string;
  deleteSceneLabel?: string;
  sceneOutdatedLabel?: string;
  interactiveCanvasLabel?: string;
  hideOutdatedIndicators?: boolean;
}
