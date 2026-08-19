import type { PlayerLesson, PlayerProgress } from "./player-types";

import { type SceneAnimation } from "@scibly/db/enums";
import { type Target, type Transition } from "framer-motion";

import {
  getSceneDesignVars,
  getScenePrimaryButtonShadowColor,
  getScenePrimaryButtonStyle,
} from "@/shared/content/learning/scene-design";

export {
  getSceneDesignVars,
  getScenePrimaryButtonShadowColor,
  getScenePrimaryButtonStyle,
};

export const ANIMATION_VARIANTS = {
  FADE: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  SLIDE_UP: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  SCALE: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  BLUR: {
    initial: { opacity: 0, filter: "blur(12px)", scale: 1.02 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    exit: { opacity: 0, filter: "blur(12px)", scale: 0.98 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
} satisfies Record<
  SceneAnimation,
  { initial: Target; animate: Target; exit: Target; transition: Transition }
>;

export function getNextLesson(
  lessons: PlayerLesson[],
  currentLessonId: string,
  progress: PlayerProgress,
): PlayerLesson | null {
  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
  for (let i = currentIndex + 1; i < lessons.length; i++) {
    if (!progress.completedLessonIds.includes(lessons[i].id)) {
      return lessons[i];
    }
  }
  return null;
}

export function isLessonAvailable(
  lessons: PlayerLesson[],
  lessonIndex: number,
  progress: PlayerProgress,
): boolean {
  if (lessonIndex === 0) return true;
  const previousLesson = lessons[lessonIndex - 1];
  return progress.completedLessonIds.includes(previousLesson.id);
}

// Uses only completedSceneIds — collab can persist IN_PROGRESS drafts while a
// learner is still on a scene, which must not skip ahead on refresh.
// Pitch scenes never get a progress row, so resume lands on the first
// uncompleted real scene rather than re-opening a pitch already passed.
export function getInitialSceneIndex(
  lesson: PlayerLesson,
  completedSceneIds: string[],
): number {
  if (!lesson.scenes?.length) return 0;
  const idx = lesson.scenes.findIndex(
    (scene) => scene.kind !== "pitch" && !completedSceneIds.includes(scene.id),
  );
  return idx === -1 ? 0 : idx;
}

export function getLessonSceneCount(lesson: PlayerLesson): number {
  return lesson.scenes?.length ?? 0;
}

export function getLessonSceneProgress(
  lesson: PlayerLesson,
  completedSceneIds: string[],
  options?: { lessonCompleted?: boolean },
) {
  const total = getLessonSceneCount(lesson);
  if (options?.lessonCompleted) {
    return { completed: total, total };
  }
  const completed = (lesson.scenes ?? []).filter((scene) =>
    completedSceneIds.includes(scene.id),
  ).length;
  return { completed, total };
}
