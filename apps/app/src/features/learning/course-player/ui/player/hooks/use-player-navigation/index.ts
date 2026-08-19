"use client";

import type { PlayerLesson, PlayerViewState } from "../../utils/player-types";
import type { RefetchProgress, UsePlayerNavigationParams } from "./types";
import type { NavigationCore } from "./use-navigation-core";

import { PUBLIC_SESSIONS_EXHAUSTED } from "@scibly/api/entitlement/codes";
import { useCallback } from "react";

import { hasApplicationCode } from "@/shared/api/trpc/application-code";

import { computeScorePct } from "../../../../../progression/progression-rules";
import {
  getInitialSceneIndex,
  getNextLesson,
} from "../../utils/player-helpers";
import { deriveAchievedScorePct } from "./calculations";
import { useNavigationCore } from "./use-navigation-core";

type LessonNavigationInput = {
  viewState: PlayerViewState;
  dispatch: NavigationCore["dispatch"];
  completedLessonIds: string[];
  completedSceneIds: string[];
  hasCertificate: boolean;
  refetchProgress: RefetchProgress;
};

function useLessonNavigationActions(input: LessonNavigationInput) {
  const {
    viewState,
    dispatch,
    completedLessonIds,
    completedSceneIds,
    hasCertificate,
    refetchProgress,
  } = input;
  const handleSelectLesson = useCallback(
    (lessonId: string, sceneIndex?: number) => {
      if (!hasCertificate && completedLessonIds.includes(lessonId)) {
        return;
      }
      dispatch({ type: "LESSON_SELECTED", lessonId, sceneIndex });
    },
    [hasCertificate, completedLessonIds, dispatch],
  );
  const handleLessonComplete = useCallback(
    (spEarned: number) => {
      if (viewState.type !== "lesson") return;
      const { lessonId } = viewState;
      dispatch({
        type: "LESSON_COMPLETED",
        lessonId,
        spEarned,
        wasAlreadyCompleted: completedLessonIds.includes(lessonId),
      });
      void refetchProgress();
    },
    [viewState, completedLessonIds, dispatch, refetchProgress],
  );
  const handleExitLesson = useCallback(() => {
    void refetchProgress();
    dispatch({ type: "LESSON_EXITED" });
  }, [refetchProgress, dispatch]);
  const getInitialSceneIndexForLesson = useCallback(
    (lesson: PlayerLesson) => getInitialSceneIndex(lesson, completedSceneIds),
    [completedSceneIds],
  );
  return {
    handleSelectLesson,
    handleLessonComplete,
    handleExitLesson,
    getInitialSceneIndexForLesson,
  };
}

type CompletionNavigationInput = {
  viewState: PlayerViewState;
  dispatch: NavigationCore["dispatch"];
  courseLessons: PlayerLesson[] | undefined;
  progress: NavigationCore["viewModel"]["progress"];
  courseMaxSP: number;
  refetchProgress: RefetchProgress;
  refetchCourse: () => Promise<void>;
  completeSessionMutation: NavigationCore["completeSessionMutation"];
  courseId: string;
  isAnonymous: boolean;
  anonymousId: string | undefined;
};

function useCompletionNavigationActions(input: CompletionNavigationInput) {
  const {
    viewState,
    dispatch,
    courseLessons,
    progress,
    courseMaxSP,
    refetchProgress,
    refetchCourse,
    completeSessionMutation,
    courseId,
    isAnonymous,
    anonymousId,
  } = input;
  const handleContinueFromComplete = useCallback(() => {
    if (!courseLessons || viewState.type !== "complete") return;
    const next = getNextLesson(courseLessons, viewState.lessonId, progress);
    if (next) {
      dispatch({
        type: "PATH_STARTED",
        fromLessonId: viewState.lessonId,
        toLessonId: next.id,
      });
      return;
    }
    const finalScorePct = computeScorePct(progress.totalSP, courseMaxSP);
    if (isAnonymous && anonymousId) {
      completeSessionMutation.mutate(
        { courseId, anonymousId },
        {
          onSuccess: () => {
            void refetchProgress().then(() => {
              dispatch({ type: "COURSE_COMPLETED", finalScorePct });
            });
          },
        },
      );
      return;
    }
    void refetchCourse().then(() => {
      void refetchProgress().then(() => {
        dispatch({ type: "COURSE_COMPLETED", finalScorePct });
      });
    });
  }, [
    courseLessons,
    viewState,
    progress,
    courseMaxSP,
    dispatch,
    refetchProgress,
    refetchCourse,
    completeSessionMutation,
    courseId,
    isAnonymous,
    anonymousId,
  ]);
  const clearPathProgression = useCallback(
    () => dispatch({ type: "PATH_CLEARED" }),
    [dispatch],
  );
  return { handleContinueFromComplete, clearPathProgression };
}

type BackToOverviewInput = {
  dispatch: NavigationCore["dispatch"];
  resetCompletionRestore: () => void;
  refetchProgress: RefetchProgress;
  refetchCourse: () => Promise<void>;
};

function useBackToOverviewAction(input: BackToOverviewInput) {
  const { dispatch, resetCompletionRestore, refetchProgress, refetchCourse } =
    input;
  return useCallback(() => {
    resetCompletionRestore();
    dispatch({ type: "RESTART_BEGIN" });
    void refetchCourse().then(() => {
      void refetchProgress().then(() => dispatch({ type: "RESTART_COMPLETE" }));
    });
  }, [dispatch, resetCompletionRestore, refetchProgress, refetchCourse]);
}

type RestartAttemptInput = {
  dispatch: NavigationCore["dispatch"];
  resetCompletionRestore: () => void;
  startSessionMutation: NavigationCore["startSessionMutation"];
  refetchProgress: RefetchProgress;
  courseId: string;
  anonymousId: string | undefined;
};

// Destructive: wipes the attempt's score/progress, so callers must gate this behind confirmation.
function useRestartAttemptAction(input: RestartAttemptInput) {
  const {
    dispatch,
    resetCompletionRestore,
    startSessionMutation,
    refetchProgress,
    courseId,
    anonymousId,
  } = input;
  return useCallback(() => {
    if (!anonymousId) return;
    resetCompletionRestore();
    dispatch({ type: "RESTART_BEGIN" });
    startSessionMutation.mutate(
      { courseId, anonymousId, reset: true },
      {
        onSuccess: () => {
          void refetchProgress().then(() =>
            dispatch({ type: "RESTART_COMPLETE" }),
          );
        },
        onError: () => dispatch({ type: "RESTART_FAILED" }),
      },
    );
  }, [
    dispatch,
    resetCompletionRestore,
    startSessionMutation,
    refetchProgress,
    courseId,
    anonymousId,
  ]);
}

export function usePlayerNavigation(params: UsePlayerNavigationParams) {
  const core = useNavigationCore(params);
  const { sessionState, viewState, dispatch, viewModel, data } = core;
  const lessonActions = useLessonNavigationActions({
    viewState,
    dispatch,
    completedLessonIds: viewModel.progress.completedLessonIds,
    completedSceneIds: viewModel.progress.completedSceneIds,
    hasCertificate: viewModel.courseState.hasCertificate,
    refetchProgress: data.refetchProgress,
  });
  const completionActions = useCompletionNavigationActions({
    viewState,
    dispatch,
    courseLessons: data.course?.lessons,
    progress: viewModel.progress,
    courseMaxSP: viewModel.courseMaxSP,
    refetchProgress: data.refetchProgress,
    refetchCourse: data.refetchCourse,
    completeSessionMutation: core.completeSessionMutation,
    courseId: core.courseId,
    isAnonymous: core.isAnonymous,
    anonymousId: core.anonymousId,
  });
  const handleBackToOverview = useBackToOverviewAction({
    dispatch,
    resetCompletionRestore: core.resetCompletionRestore,
    refetchProgress: data.refetchProgress,
    refetchCourse: data.refetchCourse,
  });
  const handleRestartAttempt = useRestartAttemptAction({
    dispatch,
    resetCompletionRestore: core.resetCompletionRestore,
    startSessionMutation: core.startSessionMutation,
    refetchProgress: data.refetchProgress,
    courseId: core.courseId,
    anonymousId: core.anonymousId,
  });
  const { courseState } = viewModel;
  return {
    mode: core.isAnonymous ? ("anonymous" as const) : ("member" as const),
    isLoading: data.isLoading,
    course: data.course,
    unavailableReason: data.unavailableReason,
    retryCourse: data.retryCourse,
    progress: viewModel.progress,
    viewState,
    currentLesson: viewModel.currentLesson,
    initialLessonSP: viewModel.initialLessonSP,
    lessonMaxSp: viewModel.lessonMaxSp,
    courseMaxSP: viewModel.courseMaxSP,
    nextLessonTitle: viewModel.nextLessonTitle,
    pathProgression: sessionState.pathProgression,
    clearPathProgression: completionActions.clearPathProgression,
    enrollmentId: core.isAnonymous
      ? undefined
      : data.memberCourse?.enrollmentId,
    ...courseState,
    isAnonymous: core.isAnonymous,
    anonymousId: core.anonymousId,
    courseId: core.courseId,
    initialPendingSubmissions: viewModel.initialPendingSubmissions,
    achievedScorePct: deriveAchievedScorePct(
      viewState,
      viewModel.progress.totalSP,
      viewModel.courseMaxSP,
    ),
    requiredScorePct: data.course?.passingScorePct ?? null,
    maxTries: data.course?.maxTries ?? null,
    version: data.course?.version,
    ...lessonActions,
    getInitialSceneIndex: lessonActions.getInitialSceneIndexForLesson,
    handleContinueFromComplete: completionActions.handleContinueFromComplete,
    handleBackToOverview,
    handleRestartAttempt,
    restartCount: sessionState.restartCount,
    isRestartPending: sessionState.isRestartingExplicitly,

    isPubliclyUnavailable: hasApplicationCode(
      core.startSessionMutation.error,
      PUBLIC_SESSIONS_EXHAUSTED,
    ),
  };
}
