import type { LessonSessionSnapshot } from "../lesson-player/progression/lesson-progression.machine";
import type {
  PathProgression,
  PlayerCourse,
  PlayerLesson,
  PlayerProgress,
  PlayerViewState,
} from "../utils/player-types";

import { useCallback, useMemo, useState } from "react";

import { getInitialSceneIndex, getNextLesson } from "../utils/player-helpers";
import { initialPlayerProgress } from "../utils/player-types";
import { resolvePlayerViewState } from "./use-player-navigation/calculations";

interface UsePlayerViewStateParams {
  course: PlayerCourse | undefined;
}

export function usePlayerViewState({ course }: UsePlayerViewStateParams) {
  const lessons = course?.lessons;
  const [sessionViewState, setViewState] = useState<PlayerViewState>({
    type: "overview",
  });
  const [progress, setProgress] = useState<PlayerProgress>(
    initialPlayerProgress,
  );

  const viewState = resolvePlayerViewState(
    course,
    sessionViewState,
    progress.completedLessonIds,
  );
  const [pathProgression, setPathProgression] =
    useState<PathProgression | null>(null);

  const [lessonSessions, setLessonSessions] = useState<
    Record<string, LessonSessionSnapshot>
  >({});

  const activeLessonId =
    viewState.type === "lesson" ? viewState.lessonId : undefined;
  const activeSession = activeLessonId
    ? lessonSessions[activeLessonId]
    : undefined;

  const handleLessonSessionChange = useCallback(
    (snapshot: LessonSessionSnapshot) => {
      if (!activeLessonId) return;
      setLessonSessions((prev) => ({ ...prev, [activeLessonId]: snapshot }));
    },
    [activeLessonId],
  );

  const completedSceneIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...progress.completedSceneIds,
          ...Object.values(lessonSessions).flatMap(
            (session) => session.completedSceneIds,
          ),
        ]),
      ),
    [progress.completedSceneIds, lessonSessions],
  );

  const getInitialSceneIndexForLesson = useCallback(
    (lesson: PlayerLesson) => getInitialSceneIndex(lesson, completedSceneIds),
    [completedSceneIds],
  );

  const handleSelectLesson = useCallback(
    (lessonId: string, sceneIndex?: number) => {
      setViewState({ type: "lesson", lessonId, sceneIndex });
    },
    [],
  );

  const handleLessonComplete = useCallback(
    (spEarned: number) => {
      if (viewState.type !== "lesson") return;
      const lessonId = viewState.lessonId;
      const lesson = lessons?.find((entry) => entry.id === lessonId);
      const lessonSceneIds = lesson?.scenes?.map((scene) => scene.id) ?? [];
      setProgress((prev) => ({
        ...prev,
        totalSP: prev.totalSP + spEarned,
        completedLessonIds: Array.from(
          new Set([...prev.completedLessonIds, lessonId]),
        ),
        completedSceneIds: Array.from(
          new Set([...prev.completedSceneIds, ...lessonSceneIds]),
        ),
      }));
      setViewState({ type: "complete", lessonId, spEarned });
    },
    [viewState, lessons],
  );

  const handleExitLesson = useCallback(
    () => setViewState({ type: "overview" }),
    [],
  );

  const handleContinueFromComplete = useCallback(() => {
    if (!lessons || viewState.type !== "complete") return;
    const next = getNextLesson(lessons, viewState.lessonId, progress);
    if (!next) {
      setViewState({ type: "course_complete" });
      return;
    }
    setPathProgression({
      fromLessonId: viewState.lessonId,
      toLessonId: next.id,
    });
    setViewState({ type: "overview" });
  }, [lessons, viewState, progress]);

  const handleBackToOverview = useCallback(
    () => setViewState({ type: "overview" }),
    [],
  );

  const clearPathProgression = useCallback(() => {
    setPathProgression(null);
  }, []);

  const nextLessonTitle =
    lessons && viewState.type === "complete"
      ? getNextLesson(lessons, viewState.lessonId, progress)?.title
      : undefined;

  const sessionProgress: PlayerProgress = { ...progress, completedSceneIds };

  return {
    viewState,
    progress: sessionProgress,
    pathProgression,
    nextLessonTitle,
    initialLessonSP: activeSession?.sessionSP ?? 0,
    initialPendingSubmissions: activeSession?.pendingSubmissions,
    getInitialSceneIndex: getInitialSceneIndexForLesson,
    handleLessonSessionChange,
    handleSelectLesson,
    handleLessonComplete,
    handleExitLesson,
    handleContinueFromComplete,
    handleBackToOverview,
    clearPathProgression,
  };
}
