"use client";

import type { UsePlayerNavigationParams } from "./types";

import { useCallback, useMemo, useReducer } from "react";

import { api } from "@/shared/api/trpc/client";

import {
  buildNavigationViewModel,
  derivePlayerProgress,
  resolvePlayerViewState,
} from "./calculations";
import {
  initialNavigationSessionState,
  navigationSessionReducer,
} from "./navigation-session";
import { useAnonymousSession } from "./use-anonymous-session";
import { useCompletionRestore } from "./use-completion-restore";
import { usePlayerCourseData } from "./use-player-course-data";

export { EMPTY_PROGRESS_DELTA } from "./navigation-session";

export function useNavigationCore(params: UsePlayerNavigationParams) {
  const {
    courseId,
    isAnonymous = false,
    anonymousId,
    source,
    embedOrigin,
  } = params;
  const [sessionState, dispatch] = useReducer(
    navigationSessionReducer,
    initialNavigationSessionState,
  );
  const data = usePlayerCourseData({ courseId, isAnonymous, anonymousId });

  const viewState = useMemo(
    () =>
      resolvePlayerViewState(
        data.course,
        sessionState.viewState,
        derivePlayerProgress(data.dbProgress, sessionState.localProgressDelta)
          .completedLessonIds,
      ),
    [
      data.course,
      data.dbProgress,
      sessionState.viewState,
      sessionState.localProgressDelta,
    ],
  );
  const viewModel = useMemo(
    () =>
      buildNavigationViewModel({
        course: data.course,
        dbProgress: data.dbProgress,
        memberCourse: data.memberCourse,
        localProgressDelta: sessionState.localProgressDelta,
        viewState,
        isAnonymous,
      }),
    [
      data.course,
      data.dbProgress,
      data.memberCourse,
      sessionState.localProgressDelta,
      viewState,
      isAnonymous,
    ],
  );
  const completeSessionMutation =
    api.sceneProgress.completeAnonymousSession.useMutation();
  const startSessionMutation = useAnonymousSession({
    courseId,
    anonymousId,
    enabled: isAnonymous,
    courseReady: Boolean(data.course),
    refetchProgress: data.refetchProgress,
    source,
    embedOrigin,
  });
  const onRestoreCourseComplete = useCallback(
    (finalScorePct: number) =>
      dispatch({ type: "COURSE_COMPLETED", finalScorePct }),
    [],
  );
  const resetCompletionRestore = useCompletionRestore({
    isProgressLoading: data.isProgressLoading,
    status: data.dbProgress?.status,
    totalSP: data.dbProgress?.totalSP,
    courseMaxSP: viewModel.courseMaxSP,
    hasCertificate: viewModel.courseState.hasCertificate,
    onRestoreCourseComplete,
  });

  return {
    ...params,
    isAnonymous,
    sessionState,
    viewState,
    dispatch,
    data,
    viewModel,
    completeSessionMutation,
    startSessionMutation,
    resetCompletionRestore,
  };
}

export type NavigationCore = ReturnType<typeof useNavigationCore>;
