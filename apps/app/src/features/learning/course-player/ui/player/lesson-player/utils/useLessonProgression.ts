"use client";

import type { SnapshotFrom } from "xstate";
import type { PlayerLesson, ProgressionMode } from "../../utils/player-types";
import type {
  LessonProgressionContext,
  LessonProgressionEvent,
  LessonSessionSnapshot,
  PendingSceneSubmission,
  SceneSubmissionCommand,
} from "../progression/lesson-progression.model";
import type { UseLessonProgressionOptions } from "./use-lesson-progression.types";

import { useEventCallback } from "@scibly/lib/hooks/use-event-callback";
import { useMachine } from "@xstate/react";
import { useEffect, useMemo, useRef } from "react";
import { shallow } from "zustand/shallow";

import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";

import { getLessonSceneCount } from "../../utils/player-helpers";
import { lessonProgressionMachine } from "../progression/lesson-progression.machine";
import {
  deriveLessonProgressionView,
  deriveSceneAssessment,
  type SceneAssessment,
  scenePlayModeFromManifest,
} from "../progression/lesson-progression.view-model";
import { useSubmitScene } from "../progression/use-submit-scene";
import {
  buildPendingSceneSnapshot,
  buildSceneSubmissionCommand,
} from "./lesson-progression-helpers";
import { hydratePendingSubmissions } from "./pending-submission-feedback";
import { useInjectLearnerAnswers } from "./use-inject-learner-answers";

type ProgressionSnapshot = SnapshotFrom<typeof lessonProgressionMachine>;
type SendProgressionEvent = (event: LessonProgressionEvent) => void;

function useProgressionActor(
  options: UseLessonProgressionOptions,
  mode: ProgressionMode,
) {
  const submitScene = useSubmitScene({
    mode,
    lessonId: options.lesson.id,
    enrollmentId: options.enrollmentId,
    anonymousId: options.anonymousId,
    courseId: options.courseId,
  });
  const onComplete = useEventCallback(options.onComplete);
  const scenePlayModes = useMemo(
    () =>
      Object.fromEntries(
        options.lesson.scenes.map((scene) => [
          scene.id,
          scenePlayModeFromManifest(scene),
        ]),
      ),
    [options.lesson.scenes],
  );
  const initialPendingSubmissions = useMemo(
    () => hydratePendingSubmissions(options.initialPendingSubmissions ?? {}),
    [options.initialPendingSubmissions],
  );
  const [snapshot, machineSend] = useMachine(lessonProgressionMachine, {
    input: {
      sceneIds: options.lesson.scenes.map((scene) => scene.id),
      scenePlayModes,
      initialSceneIndex: options.initialSceneIndex,
      initialPendingSubmissions,
      completedSceneIds: options.completedSceneIds,
      initialSessionSP: options.initialSessionSP,
      isReadOnly: options.isReadOnly,
      submitScene,
      onComplete,
    },
  });
  const send = useEventCallback((event: LessonProgressionEvent) => {
    machineSend(event);
  });
  return { snapshot, send };
}

function useSceneAssessment(
  currentScene: PlayerLesson["scenes"][number] | undefined,
  pendingSubmission: PendingSceneSubmission | undefined,
) {
  const qaSnapshot = useQuestionBlockStore(
    (store) => ({
      editor: store.editor,
      questionBlocks: store.questionBlocks,
      submitAnswers: store.submit,
      checkIfAllAnswered: store.checkIfAllAnswered,
    }),
    shallow,
  );
  return useMemo(
    () => deriveSceneAssessment(qaSnapshot, currentScene, pendingSubmission),
    [qaSnapshot, currentScene, pendingSubmission],
  );
}

function usePrimaryAction({
  assessment,
  snapshot,
  send,
  nextRequestSequence,
}: {
  assessment: SceneAssessment;
  snapshot: ProgressionSnapshot;
  send: SendProgressionEvent;
  nextRequestSequence: () => number;
}) {
  const createCommand = useEventCallback(
    (): SceneSubmissionCommand | undefined => {
      if (!assessment.currentScene) return undefined;
      return buildSceneSubmissionCommand({
        sceneId: assessment.currentScene.id,
        requestSequence: nextRequestSequence(),
        blocks: assessment.collectBlocks(),
      });
    },
  );
  return useEventCallback(() => {
    const currentScene = assessment.currentScene;
    if (!currentScene) return;
    if (snapshot.hasTag("canAdvance")) {
      send({ type: "NEXT", sceneId: currentScene.id });
      return;
    }
    if (snapshot.hasTag("canFinish")) {
      send({ type: "FINISH", sceneId: currentScene.id });
      return;
    }
    if (!snapshot.hasTag("canSubmit")) return;
    if (!assessment.submitAnswers()) return;
    const command = createCommand();
    if (!command) return;
    if (snapshot.hasTag("requiresAnswers") && !command.blocks?.length) return;
    send({ type: "SUBMIT", sceneId: currentScene.id, command });
  });
}

function usePracticeSubmit(
  send: SendProgressionEvent,
  nextRequestSequence: () => number,
) {
  return useEventCallback((sceneId: string, work: unknown) => {
    const command = buildSceneSubmissionCommand({
      sceneId,
      requestSequence: nextRequestSequence(),
      blocks: undefined,
      practiceWork: work,
    });
    send({ type: "SUBMIT", sceneId, command });
  });
}

function useNavigationActions(
  context: LessonProgressionContext,
  assessment: SceneAssessment,
  send: SendProgressionEvent,
) {
  const currentSnapshot = useEventCallback(
    (): PendingSceneSubmission | undefined => {
      if (!assessment.currentScene || !assessment.hasQuestions)
        return undefined;
      const existing = context.pendingSubmissions[assessment.currentScene.id];
      return buildPendingSceneSnapshot(
        assessment.currentScene.id,
        assessment.collectBlocks(),
        existing,
      );
    },
  );
  const handlePrevious = useEventCallback(() => {
    if (!assessment.currentScene) return;
    send({
      type: "GO_TO_SCENE",
      sceneId: assessment.currentScene.id,
      index: context.sceneIndex - 1,
      snapshot: currentSnapshot(),
    });
  });
  return { handlePrevious };
}

function useSessionSnapshot(
  context: LessonProgressionContext,
  onSessionChange: ((snapshot: LessonSessionSnapshot) => void) | undefined,
) {
  const emit = useEventCallback(onSessionChange);
  const {
    sceneIndex,
    sessionSP,
    completedSceneIdsInSession,
    pendingSubmissions,
  } = context;
  useEffect(() => {
    emit?.({
      sceneIndex,
      sessionSP,
      completedSceneIds: Object.keys(completedSceneIdsInSession),
      pendingSubmissions,
    });
  }, [
    emit,
    sceneIndex,
    sessionSP,
    completedSceneIdsInSession,
    pendingSubmissions,
  ]);
}

function useAnimationCompletion(
  snapshot: ProgressionSnapshot,
  send: SendProgressionEvent,
) {
  const isCelebrating = snapshot.matches("celebrating");
  const showSPAnimation = snapshot.context.showSPAnimation;
  useEffect(() => {
    if (!showSPAnimation && !isCelebrating) return;
    const timeout = window.setTimeout(
      () => send({ type: "ANIMATION_FINISHED" }),
      showSPAnimation ? 1500 : 0,
    );
    return () => window.clearTimeout(timeout);
  }, [showSPAnimation, isCelebrating, send]);
}

export function useLessonProgression(options: UseLessonProgressionOptions) {
  const mode = options.mode ?? "member";
  const isReadOnly = options.isReadOnly ?? false;
  const { snapshot, send } = useProgressionActor(options, mode);
  const context = snapshot.context;
  const currentScene = options.lesson.scenes[context.sceneIndex];
  const pendingSubmission = currentScene
    ? context.pendingSubmissions[currentScene.id]
    : undefined;
  const assessment = useSceneAssessment(currentScene, pendingSubmission);
  // `requestId` is `${sceneId}:${n}`, so one counter serves every scene.
  const requestSequence = useRef(0);
  const nextRequestSequence = useEventCallback(
    () => (requestSequence.current += 1),
  );
  const handleNext = usePrimaryAction({
    assessment,
    snapshot,
    send,
    nextRequestSequence,
  });
  const submitPracticeWork = usePracticeSubmit(send, nextRequestSequence);
  const navigation = useNavigationActions(context, assessment, send);
  useInjectLearnerAnswers({
    editor: assessment.editor,
    currentScene: assessment.currentScene,
    pendingSubmission,
  });
  useSessionSnapshot(context, options.onSessionChange);
  useAnimationCompletion(snapshot, send);

  const totalScenes = getLessonSceneCount(options.lesson);
  const facets = deriveLessonProgressionView({
    snapshot,
    assessment,
    totalScenes,
    isReadOnly,
    pendingSubmission,
    t: options.t,
  });

  const sendExit = (
    action: Extract<LessonProgressionEvent, { type: "EXIT" }>["action"],
  ) => send({ type: "EXIT", action });

  return {
    scene: facets.scene,
    chrome: facets.chrome,
    submission: facets.submission,
    actions: {
      handleNext,
      submitPracticeWork,
      handlePrevious: navigation.handlePrevious,
      showExit: () => sendExit("show"),
      hideExit: () => sendExit("hide"),
      toggleMenu: () => sendExit("toggleMenu"),
    },
  };
}
