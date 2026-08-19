import type { PlayerViewState } from "../../utils/player-types";

export type LocalProgressDelta = { completedLessonIds: string[] };

export const EMPTY_PROGRESS_DELTA: LocalProgressDelta = {
  completedLessonIds: [],
};

export interface NavigationSessionState {
  viewState: PlayerViewState;
  localProgressDelta: LocalProgressDelta;
  restartCount: number;
  isRestartingExplicitly: boolean;
  pathProgression: { fromLessonId: string; toLessonId: string } | null;
}

export const initialNavigationSessionState: NavigationSessionState = {
  viewState: { type: "overview" },
  localProgressDelta: EMPTY_PROGRESS_DELTA,
  restartCount: 0,
  isRestartingExplicitly: false,
  pathProgression: null,
};

type NavigationSessionEvent =
  | { type: "LESSON_SELECTED"; lessonId: string; sceneIndex?: number }
  | {
      type: "LESSON_COMPLETED";
      lessonId: string;
      spEarned: number;
      wasAlreadyCompleted: boolean;
    }
  | { type: "LESSON_EXITED" }
  | { type: "COURSE_COMPLETED"; finalScorePct: number }
  | {
      type: "PATH_STARTED";
      fromLessonId: string;
      toLessonId: string;
    }
  | { type: "PATH_CLEARED" }
  | { type: "RESTART_BEGIN" }
  | { type: "RESTART_COMPLETE" }
  | { type: "RESTART_FAILED" };

export function navigationSessionReducer(
  state: NavigationSessionState,
  event: NavigationSessionEvent,
): NavigationSessionState {
  switch (event.type) {
    case "LESSON_SELECTED":
      return {
        ...state,
        viewState: {
          type: "lesson",
          lessonId: event.lessonId,
          sceneIndex: event.sceneIndex,
        },
      };
    case "LESSON_COMPLETED":
      return {
        ...state,
        viewState: {
          type: "complete",
          lessonId: event.lessonId,
          spEarned: event.spEarned,
        },
        localProgressDelta: event.wasAlreadyCompleted
          ? state.localProgressDelta
          : {
              completedLessonIds: [
                ...state.localProgressDelta.completedLessonIds,
                event.lessonId,
              ],
            },
      };
    case "LESSON_EXITED":
      return { ...state, viewState: { type: "overview" } };
    case "COURSE_COMPLETED":
      return {
        ...state,
        viewState: {
          type: "course_complete",
          finalScorePct: event.finalScorePct,
        },
      };
    case "PATH_STARTED":
      return {
        ...state,
        pathProgression: {
          fromLessonId: event.fromLessonId,
          toLessonId: event.toLessonId,
        },
        viewState: { type: "overview" },
      };
    case "PATH_CLEARED":
      return { ...state, pathProgression: null };
    case "RESTART_BEGIN":
      return {
        ...state,
        localProgressDelta: EMPTY_PROGRESS_DELTA,
        isRestartingExplicitly: true,
      };
    case "RESTART_COMPLETE":
      return {
        ...state,
        isRestartingExplicitly: false,
        restartCount: state.restartCount + 1,
        viewState: { type: "overview" },
      };
    case "RESTART_FAILED":
      return { ...state, isRestartingExplicitly: false };
    default:
      return state;
  }
}
