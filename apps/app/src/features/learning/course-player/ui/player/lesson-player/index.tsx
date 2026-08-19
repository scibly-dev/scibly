"use client";

import type { PlayerLesson, ProgressionMode } from "../utils/player-types";
import type {
  LessonSessionSnapshot,
  PendingSceneSubmission,
} from "./progression/lesson-progression.model";
import type {
  SceneContentQueryResult,
  SceneContentSource,
} from "./utils/use-scene-content";

import { useEffect, useMemo } from "react";

import "@/shared/content/editor/styles/base-editor.css";
import { useTranslation } from "@/i18n/hooks/use-translation";

import { getLessonSceneProgress } from "../utils/player-helpers";
import { EmptyLesson } from "./components/empty-lesson";
import { LessonPlayerShell } from "./components/lesson-player-shell";
import { LessonSceneContentLoader } from "./components/scene-content-loader";
import { useLessonProgression } from "./utils/useLessonProgression";

type LessonProgression = ReturnType<typeof useLessonProgression>;

interface LessonPlayerProps {
  mode: ProgressionMode;
  lesson: PlayerLesson;
  enrollmentId?: string;
  initialSceneIndex?: number;
  initialPendingSubmissions?: Record<string, PendingSceneSubmission>;
  completedSceneIds?: string[];
  initialSessionSP?: number;
  onComplete: (spEarned: number) => void;
  onSessionChange?: (snapshot: LessonSessionSnapshot) => void;
  onExit: () => void;

  canExit?: boolean;
  isReadOnly?: boolean;
  isAnonymous?: boolean;
  anonymousId?: string;
  courseId?: string;
  courseVersionId?: string;
  triesCount?: number;
}

function getSceneContentSource(
  props: LessonPlayerProps,
  sceneId: string,
  nextSceneId: string | undefined,
): SceneContentSource {
  if (props.mode === "anonymous") {
    if (!props.courseId || !props.courseVersionId) {
      throw new Error(
        "Anonymous scene content requires course and version ids.",
      );
    }
    return {
      mode: "anonymous",
      courseId: props.courseId,
      courseVersionId: props.courseVersionId,
      sceneId,
      nextSceneId,
    };
  }
  if (!props.courseId) {
    const label = props.mode === "member" ? "Member" : "Preview";
    throw new Error(`${label} scene content requires a course id.`);
  }
  return {
    mode: props.mode,
    courseId: props.courseId,
    sceneId,
    nextSceneId,
  };
}

function useLessonPlayerHotkeys(
  progression: Pick<LessonProgression, "actions" | "scene">,
  canExit: boolean,
) {
  const { showExit, handlePrevious } = progression.actions;
  const canGoBack = progression.scene.canGoBack;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (canExit) showExit();
      } else if (event.key === "ArrowLeft" && canGoBack) handlePrevious();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showExit, handlePrevious, canGoBack, canExit]);
}

function useExitModalSceneProgress(
  lesson: PlayerLesson,
  completedSceneIds: string[] | undefined,
  completedSceneIdsInSession: Record<string, true>,
) {
  return useMemo(() => {
    const mergedCompletedIds = new Set(completedSceneIds ?? []);
    for (const sceneId of Object.keys(completedSceneIdsInSession)) {
      mergedCompletedIds.add(sceneId);
    }
    return getLessonSceneProgress(lesson, [...mergedCompletedIds]);
  }, [completedSceneIds, completedSceneIdsInSession, lesson]);
}

export function LessonPlayer(props: LessonPlayerProps) {
  const { translations: t } = useTranslation("learningPlayer");
  const progression = useLessonProgression({
    mode: props.mode,
    lesson: props.lesson,
    enrollmentId: props.enrollmentId,
    initialSceneIndex: props.initialSceneIndex ?? 0,
    initialPendingSubmissions: props.initialPendingSubmissions,
    completedSceneIds: props.completedSceneIds,
    initialSessionSP: props.initialSessionSP,
    onComplete: props.onComplete,
    onSessionChange: props.onSessionChange,
    isReadOnly: props.isReadOnly,
    anonymousId: props.anonymousId,
    courseId: props.courseId,
    t: t.navigation,
  });
  const canExit = props.canExit ?? true;
  useLessonPlayerHotkeys(progression, canExit);
  const exitModalSceneProgress = useExitModalSceneProgress(
    props.lesson,
    props.completedSceneIds,
    progression.chrome.completedSceneIdsInSession,
  );

  const currentScene = progression.scene.currentScene;
  if (!currentScene) {
    return <EmptyLesson onExit={props.onExit} t={t} />;
  }

  const shell = (sceneContent: SceneContentQueryResult) => (
    <LessonPlayerShell
      onExit={props.onExit}
      canExit={canExit}
      isAnonymous={props.isAnonymous}
      progression={progression}
      currentScene={currentScene}
      sceneContent={sceneContent}
      exitModalSceneProgress={exitModalSceneProgress}
      t={t}
    />
  );

  if (currentScene.kind === "pitch") {
    return shell(PITCH_SCENE_CONTENT);
  }

  // Prefetch skips pitch ids: the server has no content row for them.
  const nextSceneId = props.lesson.scenes
    .slice(progression.scene.sceneIndex + 1)
    .find((scene) => scene.kind !== "pitch")?.id;
  const source = getSceneContentSource(props, currentScene.id, nextSceneId);

  return (
    <LessonSceneContentLoader source={source}>{shell}</LessonSceneContentLoader>
  );
}

const PITCH_SCENE_CONTENT: SceneContentQueryResult = {
  learnerContent: null,
  isLoading: false,
  isRefetching: false,
  error: null,
  refetch: () => {},
};
