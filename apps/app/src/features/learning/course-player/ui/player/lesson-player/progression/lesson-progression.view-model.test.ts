import type { Actor } from "xstate";
import type { NavigationTranslations } from "../utils/lesson-progression-helpers";
import type { lessonProgressionMachine as LessonProgressionMachine } from "./lesson-progression.machine";
import type {
  PendingSceneSubmission,
  SceneKind,
  SceneResult,
  SubmitScene,
} from "./lesson-progression.model";
import type { SceneAssessment } from "./lesson-progression.view-model";

import { describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { lessonProgressionMachine } from "./lesson-progression.machine";
import { deriveLessonProgressionView } from "./lesson-progression.view-model";

// Snapshots are produced by driving a real actor into each state rather than
// hand-built, so a tag rename in lesson-progression.states.ts fails here too.

vi.mock("../utils/player-sfx", () => ({
  playFeedbackSound: vi.fn(),
  playSceneSpEarnSound: vi.fn(),
}));

type LessonActor = Actor<typeof LessonProgressionMachine>;
type ProgressionSnapshot = ReturnType<LessonActor["getSnapshot"]>;

const T: NavigationTranslations = {
  saving: "Saving...",
  done: "Done",
  next: "Next",
  check: "Check",
  complete: "Finish",
  submissionError: "We couldn't check your answer.",
};

const ANSWER = [
  { blockId: "b1", blockType: "multiple-choice", learnerAnswer: "a" },
] as const;

interface LessonOptions {
  kinds?: SceneKind[];
  completedSceneIds?: string[];
  initialSceneIndex?: number;
  initialPendingSubmissions?: Record<string, PendingSceneSubmission>;
  isReadOnly?: boolean;
  submitScene?: SubmitScene;
}

function startLesson(options: LessonOptions = {}): LessonActor {
  const kinds = options.kinds ?? ["assessment", "assessment"];
  const sceneIds = kinds.map((_, index) => `s${index + 1}`);
  const sceneKinds: Record<string, SceneKind> = {};
  sceneIds.forEach((sceneId, index) => {
    sceneKinds[sceneId] = kinds[index]!;
  });
  const actor = createActor(lessonProgressionMachine, {
    input: {
      sceneIds,
      sceneKinds,
      initialSceneIndex: options.initialSceneIndex,
      initialPendingSubmissions: options.initialPendingSubmissions,
      completedSceneIds: options.completedSceneIds,
      isReadOnly: options.isReadOnly,
      submitScene:
        options.submitScene ??
        vi.fn<SubmitScene>(async () => ({ spEarned: 0 })),
      onComplete: vi.fn(),
    },
  });
  actor.start();
  return actor;
}

const snapshots = {
  answering: (): ProgressionSnapshot => startLesson().getSnapshot(),

  viewing: (kinds: SceneKind[] = ["content", "content"]): ProgressionSnapshot =>
    startLesson({ kinds }).getSnapshot(),

  readyToAdvance: (): ProgressionSnapshot => {
    const actor = startLesson({
      kinds: ["assessment", "assessment", "assessment"],
      completedSceneIds: ["s1"],
      initialSceneIndex: 1,
    });

    actor.send({ type: "GO_TO_SCENE", sceneId: "s2", index: 0 });
    return actor.getSnapshot();
  },

  readyToFinish: (): ProgressionSnapshot =>
    startLesson({
      completedSceneIds: ["s1", "s2"],
      initialSceneIndex: 1,
    }).getSnapshot(),

  submitting: (): ProgressionSnapshot => {
    const actor = startLesson({
      submitScene: vi.fn<SubmitScene>(() => new Promise<SceneResult>(() => {})),
    });
    actor.send({
      type: "SUBMIT",
      sceneId: "s1",
      command: { requestId: "req-1", sceneId: "s1", blocks: [...ANSWER] },
    });
    return actor.getSnapshot();
  },

  failed: async (): Promise<ProgressionSnapshot> => {
    const actor = startLesson({
      submitScene: vi.fn<SubmitScene>(async () => {
        throw new Error("Network request failed");
      }),
    });
    actor.send({
      type: "SUBMIT",
      sceneId: "s1",
      command: { requestId: "req-1", sceneId: "s1", blocks: [...ANSWER] },
    });
    await vi.waitFor(() =>
      expect(actor.getSnapshot().context.submissionError).not.toBeNull(),
    );
    return actor.getSnapshot();
  },
};

function buildAssessment(
  overrides: Partial<SceneAssessment> = {},
): SceneAssessment {
  return {
    editor: null,
    currentScene: undefined,
    manifestKind: "assessment",
    sceneQuestionBlocks: new Map(),
    sceneBlockIds: [],
    hasQuestions: true,
    hasChecked: false,
    allAnswered: false,
    questionBlocksRegistered: false,
    submitAnswers: () => true,
    collectBlocks: () => [],
    ...overrides,
  };
}

function derive(
  snapshot: ProgressionSnapshot,
  options: {
    assessment?: Partial<SceneAssessment>;
    totalScenes?: number;
    isReadOnly?: boolean;
    pendingSubmission?: PendingSceneSubmission;
  } = {},
) {
  return deriveLessonProgressionView({
    snapshot,
    assessment: buildAssessment(options.assessment),
    totalScenes: options.totalScenes ?? 2,
    isReadOnly: options.isReadOnly ?? false,
    pendingSubmission: options.pendingSubmission,
    t: T,
  });
}

describe("lesson progression view model", () => {
  describe("when the learner may act", () => {
    it.each([
      {
        name: "LP9: a content scene may be submitted with nothing answered and no blocks registered",
        snapshot: snapshots.viewing,
        allAnswered: false,
        questionBlocksRegistered: false,
        expected: true,
      },
      {
        name: "LP6: an assessment scene with a question still unanswered may not be submitted",
        snapshot: snapshots.answering,
        allAnswered: false,
        questionBlocksRegistered: true,
        expected: false,
      },
      {
        name: "LP8: an assessment scene whose blocks have not registered may not be submitted, however answered it looks",
        snapshot: snapshots.answering,
        allAnswered: true,
        questionBlocksRegistered: false,
        expected: false,
      },
      {
        name: "LP6: an assessment scene fully answered and registered may be submitted",
        snapshot: snapshots.answering,
        allAnswered: true,
        questionBlocksRegistered: true,
        expected: true,
      },
      {
        name: "LP6: a completed scene advances without regard to its answers",
        snapshot: snapshots.readyToAdvance,
        allAnswered: false,
        questionBlocksRegistered: false,
        expected: true,
      },
      {
        name: "LP6: a completed last scene finishes without regard to its answers",
        snapshot: snapshots.readyToFinish,
        allAnswered: false,
        questionBlocksRegistered: false,
        expected: true,
      },
      {
        name: "LP10: a scene with a submission in flight offers no action at all",
        snapshot: snapshots.submitting,
        allAnswered: true,
        questionBlocksRegistered: true,
        expected: false,
      },
    ])(
      "$name",
      ({ snapshot, allAnswered, questionBlocksRegistered, expected }) => {
        const view = derive(snapshot(), {
          assessment: { allAnswered, questionBlocksRegistered },
        });

        expect(view.chrome.canAdvance).toBe(expected);
      },
    );
  });

  describe("what the primary action says", () => {
    it.each([
      {
        name: "LP29: a learner still answering is offered a check",
        snapshot: snapshots.answering,
        totalScenes: 2,
        isReadOnly: false,
        expected: T.check,
      },
      {
        name: "LP29: a content scene with another after it is offered next",
        snapshot: () => snapshots.viewing(["content", "content"]),
        totalScenes: 2,
        isReadOnly: false,
        expected: T.next,
      },
      {
        name: "LP29: a content scene that is the last one is offered finish",
        snapshot: () => snapshots.viewing(["content"]),
        totalScenes: 1,
        isReadOnly: false,
        expected: T.complete,
      },
      {
        name: "LP29: a completed scene with another after it is offered next",
        snapshot: snapshots.readyToAdvance,
        totalScenes: 3,
        isReadOnly: false,
        expected: T.next,
      },
      {
        name: "LP29: a completed last scene is offered finish",
        snapshot: snapshots.readyToFinish,
        totalScenes: 2,
        isReadOnly: false,
        expected: T.complete,
      },
      {
        name: "LP29: a submission in flight reports itself, outranking every other label",
        snapshot: snapshots.submitting,
        totalScenes: 2,
        isReadOnly: false,
        expected: T.saving,
      },
      {
        name: "LP29: a reviewer on the last scene is offered done, never finish - there is nothing left to complete",
        snapshot: snapshots.readyToFinish,
        totalScenes: 2,
        isReadOnly: true,
        expected: T.done,
      },
      {
        name: "LP29: a reviewer mid-lesson is offered next",
        snapshot: snapshots.readyToAdvance,
        totalScenes: 3,
        isReadOnly: true,
        expected: T.next,
      },
    ])("$name", ({ snapshot, totalScenes, isReadOnly, expected }) => {
      const view = derive(snapshot(), { totalScenes, isReadOnly });

      expect(view.chrome.buttonLabel).toBe(expected);
    });
  });

  describe("what the learner is shown of their result", () => {
    const FEEDBACK = {
      status: "partial",
      correctCount: 1,
      totalCount: 2,
    } as const;

    it("LP13: a graded scene shows the feedback recorded for it", () => {
      const view = derive(snapshots.readyToAdvance(), {
        assessment: { hasChecked: true },
        pendingSubmission: {
          sceneId: "s1",
          blocks: [...ANSWER],
          feedbackSummary: FEEDBACK,
        },
      });

      expect(view.scene.sceneFeedbackSummary).toEqual(FEEDBACK);
    });

    it("LP13: a scene not yet graded shows no feedback, even where a summary is recorded", () => {
      const view = derive(snapshots.answering(), {
        assessment: { hasChecked: false },
        pendingSubmission: {
          sceneId: "s1",
          blocks: [...ANSWER],
          feedbackSummary: FEEDBACK,
        },
      });

      expect(view.scene.sceneFeedbackSummary).toBeNull();
    });

    it("LP19: a failed submission surfaces a message the learner can read", async () => {
      const view = derive(await snapshots.failed());

      expect(view.submission.submissionError).toBe(T.submissionError);
    });

    it("LP19: a failed submission does not report the scene complete", async () => {
      const snapshot = await snapshots.failed();

      const view = derive(snapshot);

      expect(view.chrome.completedSceneIdsInSession).toEqual({});
      expect(view.submission.isPending).toBe(false);
    });

    it("LP19: a scene with no failure surfaces no message", () => {
      const view = derive(snapshots.answering());

      expect(view.submission.submissionError).toBeNull();
    });
  });
});
