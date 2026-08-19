export { computeScorePct } from "../progression/progression-rules";
export type {
  PlayerCourse,
  PlayerLesson,
  PlayerProgress,
  PlayerScene,
  PlayerViewState,
} from "./ui/player";
export { CoursePlayer } from "./ui/player";
export { CourseComplete } from "./ui/player/components/course-complete";
export { usePlayerNavigation } from "./ui/player/hooks/use-player-navigation";
export { normalizePreviewCourse } from "./ui/player/hooks/use-player-navigation/normalization";
export { usePlayerViewState } from "./ui/player/hooks/use-player-view-state";
export type { LearningPlayerTranslations } from "./ui/player/i18n/learning-player.types";
export {
  PLAYER_FOOTER_DOCK_HEIGHT,
  PlayerNavigationFooter,
} from "./ui/player/lesson-player/components/player-navigation-footer";
export { PlayerTopBar } from "./ui/player/lesson-player/components/player-top-bar";
export { SceneViewportShell } from "./ui/player/lesson-player/components/scene-viewport-shell";
export { SPAnimation } from "./ui/player/lesson-player/components/sp-animation";
export {
  ANIMATION_VARIANTS,
  getSceneDesignVars,
} from "./ui/player/utils/player-helpers";
