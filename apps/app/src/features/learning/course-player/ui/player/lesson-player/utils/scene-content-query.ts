import type { ProgressionMode } from "../../utils/player-types";

const LEARNER_SCENE_CONTENT_STALE_MS = Number.POSITIVE_INFINITY;
const PREVIEW_SCENE_CONTENT_STALE_MS = 0;

export function getSceneContentQueryOptions(mode: ProgressionMode) {
  if (mode === "preview") {
    return {
      staleTime: PREVIEW_SCENE_CONTENT_STALE_MS,
      refetchOnMount: true as const,
    };
  }
  return { staleTime: LEARNER_SCENE_CONTENT_STALE_MS };
}

export interface SceneContentFetchInput {
  courseId: string;
  sceneId: string;
  courseVersionId?: string;
}

export function buildNextScenePrefetchInput(
  mode: ProgressionMode,
  options: {
    courseId: string;
    nextSceneId: string;
    courseVersionId?: string;
  },
): SceneContentFetchInput | null {
  if (mode === "anonymous" && !options.courseVersionId) return null;
  return {
    courseId: options.courseId,
    sceneId: options.nextSceneId,
    courseVersionId: options.courseVersionId,
  };
}
