import type { LessonProgressionContext } from "./lesson-progression.model";

export const lessonProgressionStates = {
  playing: {
    initial: "routingScene" as const,
    on: {
      GO_TO_SCENE: {
        guard: "canGoToScene" as const,
        target: ".routingScene" as const,
        actions: ["storeNavigationSnapshot", "navigate"] as const,
      },
    },
    states: {
      routingScene: {
        id: "routingScene",
        always: [
          {
            guard: "shouldRouteToCompletion" as const,
            target: "ready.complete" as const,
          },
          {
            guard: "shouldRouteToAdvance" as const,
            target: "ready.advance" as const,
          },
          {
            guard: "isAssessmentScene" as const,
            target: "assessment.answering" as const,
          },
          {
            guard: "isPitchScene" as const,
            target: "pitch.viewing" as const,
          },
          { target: "content.viewing" as const },
        ],
      },
      assessment: {
        initial: "answering" as const,
        states: {
          answering: {
            tags: ["canSubmit", "requiresAnswers"] as const,
            on: {
              SUBMIT: {
                guard: "canSubmitAssessment" as const,
                target: "#submitting" as const,
                actions: "captureRequest" as const,
              },
            },
          },
        },
      },
      content: {
        initial: "viewing" as const,
        states: {
          viewing: {
            tags: "canSubmit" as const,
            on: {
              SUBMIT: {
                guard: "canSubmitContent" as const,
                target: "#submitting" as const,
                actions: "captureRequest" as const,
              },
            },
          },
        },
      },
      pitch: {
        initial: "viewing" as const,
        states: {
          viewing: {
            tags: "canSubmit" as const,
            on: {
              SUBMIT: {
                guard: "canSubmitPitch" as const,
                target: "#postSubmit" as const,
                actions: "completePitchLocally" as const,
              },
            },
          },
        },
      },
      submitting: {
        id: "submitting",
        tags: "pending" as const,
        invoke: {
          id: "submitScene",
          src: "submitScene" as const,
          input: ({ context }: { context: LessonProgressionContext }) => ({
            command: context.pendingRequest!,
            submitScene: context.submitScene,
          }),
          onDone: {
            guard: "isCurrentRequest" as const,
            target: "postSubmit" as const,
            actions: ["playResultSound", "applyResult"] as const,
          },
          onError: [
            {
              guard: "canAutoRetry" as const,
              target: "retryingSubmission" as const,
              actions: "incrementRetryCount" as const,
            },
            {
              guard: "isAssessmentScene" as const,
              target: "assessment.answering" as const,
              actions: "clearFailedRequest" as const,
            },
            {
              target: "content.viewing" as const,
              actions: "clearFailedRequest" as const,
            },
          ],
        },
      },
      retryingSubmission: {
        tags: "pending" as const,
        invoke: {
          id: "retryDelay",
          src: "retryDelay" as const,
          input: ({ context }: { context: LessonProgressionContext }) => ({
            attempt: context.retryCount,
          }),
          onDone: {
            target: "#submitting" as const,
          },
        },
      },
      postSubmit: {
        id: "postSubmit",
        always: [
          {
            guard: "shouldCelebrateAfterSubmit" as const,
            target: "#celebrating" as const,
            actions: "prepareCompletion" as const,
          },
          {
            guard: "shouldAdvanceAfterSubmit" as const,
            target: "routingScene" as const,
            actions: "advanceScene" as const,
          },
          { target: "routingScene" as const },
        ],
      },
      ready: {
        initial: "advance" as const,
        states: {
          advance: {
            tags: "canAdvance" as const,
            on: {
              NEXT: {
                guard: "canGoNext" as const,
                target: "#routingScene" as const,
                actions: "advanceScene" as const,
              },
            },
          },
          complete: {
            tags: "canFinish" as const,
            on: {
              FINISH: {
                guard: "canFinish" as const,
                target: "#celebrating" as const,
                actions: "prepareCompletion" as const,
              },
            },
          },
        },
      },
    },
  },
  celebrating: {
    id: "celebrating",
    entry: "notifyCompletion" as const,
    on: {
      ANIMATION_FINISHED: {
        target: "completed" as const,
        actions: "finishAnimation" as const,
      },
    },
  },
  completed: {
    type: "final" as const,
  },
};
