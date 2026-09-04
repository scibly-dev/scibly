import { assign, fromPromise, setup } from "xstate";

import { isSceneUnlocked } from "@/features/learning/progression/scene-order-rules";

import { playFeedbackSound, playSceneSpEarnSound } from "../utils/player-sfx";
import {
  applySceneResult,
  completedSceneIdSet,
  createLessonProgressionContext,
  currentScenePlayMode,
  feedbackFor,
  hasExplanation,
  hasFeedback,
  highestReachableSceneIndex,
  isCompleted,
  isCurrentScene,
  isFinalScene,
  isTransportFailure,
  type LessonProgressionContext,
  type LessonProgressionInput,
  type LessonProgressionMachineEvent,
  MAX_AUTO_RETRIES,
  retryBackoff,
  type RetryDelayInput,
  snapshotAssignment,
  type SubmissionActorInput,
  type SubmissionActorOutput,
} from "./lesson-progression.model";
import { lessonProgressionStates } from "./lesson-progression.states";

export type {
  LessonProgressionEvent,
  LessonProgressionInput,
  LessonSessionSnapshot,
  PendingSceneSubmission,
  ScenePlayMode,
  SceneResult,
  SceneSubmissionCommand,
  SubmitScene,
} from "./lesson-progression.model";
export {
  contiguousCompletedSceneIndex,
  highestReachableSceneIndex,
} from "./lesson-progression.model";

function isEligibleToLeave(context: LessonProgressionContext) {
  return context.isReadOnly || hasFeedback(context) || isCompleted(context);
}

function canSubmitCurrentScene(
  context: LessonProgressionContext,
  event: Extract<LessonProgressionMachineEvent, { type: "SUBMIT" }>,
) {
  return (
    !context.isReadOnly &&
    isCurrentScene(context, event) &&
    event.command.sceneId === event.sceneId &&
    !hasFeedback(context) &&
    !isCompleted(context) &&
    isSceneUnlocked(
      context.sceneIds,
      completedSceneIdSet(context),
      event.sceneId,
    )
  );
}

// SAFETY: `types` is XState's type-only channel — the empty objects exist to
// carry a type and are never read at runtime.
export const lessonProgressionMachine = setup({
  types: {
    context: {} as LessonProgressionContext,
    input: {} as LessonProgressionInput,
    events: {} as LessonProgressionMachineEvent,
  },
  actors: {
    submitScene: fromPromise(
      async ({
        input,
      }: {
        input: SubmissionActorInput;
      }): Promise<SubmissionActorOutput> => ({
        requestId: input.command.requestId,
        result: await input.submitScene(input.command),
      }),
    ),
    retryDelay: fromPromise(async ({ input }: { input: RetryDelayInput }) =>
      retryBackoff(input),
    ),
  },
  guards: {
    shouldRouteToCompletion: ({ context }) =>
      isEligibleToLeave(context) && isFinalScene(context),
    shouldRouteToAdvance: ({ context }) =>
      isEligibleToLeave(context) && !isFinalScene(context),
    isAssessmentScene: ({ context }) =>
      currentScenePlayMode(context) === "assessment",
    isPitchScene: ({ context }) => currentScenePlayMode(context) === "pitch",
    shouldCelebrateAfterSubmit: ({ context }) =>
      currentScenePlayMode(context) !== "assessment" &&
      !hasExplanation(context) &&
      isFinalScene(context),
    shouldAdvanceAfterSubmit: ({ context }) =>
      currentScenePlayMode(context) !== "assessment" &&
      !hasExplanation(context) &&
      !isFinalScene(context),
    canSubmitAssessment: ({ context, event }) =>
      event.type === "SUBMIT" &&
      currentScenePlayMode(context) === "assessment" &&
      (Boolean(event.command.blocks?.length) ||
        event.command.practiceWork !== undefined) &&
      canSubmitCurrentScene(context, event),
    canSubmitContent: ({ context, event }) =>
      event.type === "SUBMIT" &&
      currentScenePlayMode(context) === "content" &&
      canSubmitCurrentScene(context, event),
    canSubmitPitch: ({ context, event }) =>
      event.type === "SUBMIT" &&
      currentScenePlayMode(context) === "pitch" &&
      canSubmitCurrentScene(context, event),
    canGoToScene: ({ context, event }) =>
      event.type === "GO_TO_SCENE" &&
      context.pendingRequest === null &&
      isCurrentScene(context, event) &&
      event.index <= highestReachableSceneIndex(context) &&
      event.index >= 0 &&
      event.index < context.sceneIds.length,
    canGoNext: ({ context, event }) =>
      event.type === "NEXT" &&
      isCurrentScene(context, event) &&
      context.sceneIndex < context.sceneIds.length - 1,
    canFinish: ({ context, event }) =>
      event.type === "FINISH" &&
      isCurrentScene(context, event) &&
      isFinalScene(context),
    isCurrentRequest: ({ context, event }) =>
      event.type === "xstate.done.actor.submitScene" &&
      context.pendingRequest?.requestId === event.output.requestId,
    isFinalScene: ({ context }) => isFinalScene(context),
    canAutoRetry: ({ context, event }) =>
      event.type === "xstate.error.actor.submitScene" &&
      isTransportFailure(event.error) &&
      context.retryCount < MAX_AUTO_RETRIES,
  },
  actions: {
    captureRequest: assign(({ event }) =>
      event.type === "SUBMIT"
        ? {
            pendingRequest: event.command,
            submissionError: null,
          }
        : {},
    ),
    storeNavigationSnapshot: assign(({ context, event }) =>
      event.type === "GO_TO_SCENE" ? snapshotAssignment(context, event) : {},
    ),
    advanceScene: assign(({ context }) => ({
      sceneIndex: context.sceneIndex + 1,
      submissionError: null,
    })),
    navigate: assign(({ event }) =>
      event.type === "GO_TO_SCENE"
        ? { sceneIndex: event.index, submissionError: null }
        : {},
    ),
    playResultSound: ({ context, event }) => {
      if (
        event.type !== "xstate.done.actor.submitScene" ||
        !context.pendingRequest
      ) {
        return;
      }
      const feedback = feedbackFor(event.output.result);
      if (feedback) playFeedbackSound(feedback.status);
      else if (event.output.result.spEarned > 0) playSceneSpEarnSound();
    },
    applyResult: assign(({ context, event }) =>
      event.type === "xstate.done.actor.submitScene"
        ? applySceneResult(context, event.output)
        : {},
    ),
    completePitchLocally: assign(({ context, event }) =>
      event.type === "SUBMIT"
        ? {
            completedSceneIdsInSession: {
              ...context.completedSceneIdsInSession,
              [event.sceneId]: true as const,
            },
          }
        : {},
    ),
    clearFailedRequest: assign(({ event }) => ({
      pendingRequest: null,
      retryCount: 0,
      submissionError:
        event.type === "xstate.error.actor.submitScene" &&
        event.error instanceof Error
          ? event.error.message
          : "Failed to submit scene.",
    })),
    incrementRetryCount: assign(({ context }) => ({
      retryCount: context.retryCount + 1,
    })),
    prepareCompletion: assign(({ context }) => ({
      completionSP: context.isReadOnly ? 0 : context.sessionSP,
    })),
    notifyCompletion: ({ context }) => {
      context.onComplete(context.completionSP ?? context.sessionSP);
    },
    finishAnimation: assign({
      showSPAnimation: false,
    }),
    updateChrome: assign(({ context, event }) => {
      if (event.type !== "EXIT") return {};
      switch (event.action) {
        case "show":
          return { showExitConfirm: true };
        case "hide":
          return { showExitConfirm: false };
        case "toggleMenu":
          return { showMenu: !context.showMenu };
      }
    }),
  },
}).createMachine({
  id: "lessonProgression",
  initial: "playing",
  context: ({ input }) => createLessonProgressionContext(input),
  on: {
    EXIT: { actions: "updateChrome" },
    ANIMATION_FINISHED: { actions: "finishAnimation" },
  },
  states: lessonProgressionStates,
});
