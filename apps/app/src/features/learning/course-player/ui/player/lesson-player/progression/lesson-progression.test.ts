import type { Actor } from "xstate";
import type {
  LessonProgressionInput,
  PendingSceneSubmission,
  SceneKind,
  SceneResult,
  SubmitScene,
} from "./lesson-progression.model";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { lessonProgressionMachine } from "./lesson-progression.machine";
import {
  applySceneResult,
  createLessonProgressionContext,
} from "./lesson-progression.model";

// jsdom has no HTMLMediaElement.play, so player-sfx is doubled too.
vi.mock("../utils/player-sfx", () => ({
  playFeedbackSound: vi.fn(),
  playSceneSpEarnSound: vi.fn(),
}));

type LessonActor = Actor<typeof lessonProgressionMachine>;

const GRADED = [
  { blockId: "b1", achievedPoints: 1, maxPoints: 1, spEarned: 10 },
] as const;

const ANSWER = [
  { blockId: "b1", blockType: "multiple-choice", learnerAnswer: "a" },
] as const;

function deferredSubmit() {
  let resolveWith!: (result: SceneResult) => void;
  let rejectWith!: (error: unknown) => void;
  const submitScene = vi.fn<SubmitScene>(
    () =>
      new Promise<SceneResult>((resolve, reject) => {
        resolveWith = resolve;
        rejectWith = reject;
      }),
  );
  return {
    submitScene,
    resolveWith: (r: SceneResult) => resolveWith(r),
    rejectWith: (e: unknown) => rejectWith(e),
  };
}

interface LessonOptions {
  kinds?: SceneKind[];
  completedSceneIds?: string[];
  initialSceneIndex?: number;
  initialPendingSubmissions?: Record<string, PendingSceneSubmission>;
  initialSessionSP?: number;
  isReadOnly?: boolean;
  submitScene?: SubmitScene;
}

function buildInput(options: LessonOptions = {}): LessonProgressionInput {
  const kinds = options.kinds ?? ["assessment", "assessment"];
  const sceneIds = kinds.map((_, index) => `s${index + 1}`);
  const sceneKinds: Record<string, SceneKind> = {};
  sceneIds.forEach((sceneId, index) => {
    sceneKinds[sceneId] = kinds[index]!;
  });
  return {
    sceneIds,
    sceneKinds,
    initialSceneIndex: options.initialSceneIndex,
    initialPendingSubmissions: options.initialPendingSubmissions,
    completedSceneIds: options.completedSceneIds,
    initialSessionSP: options.initialSessionSP,
    isReadOnly: options.isReadOnly,
    submitScene:
      options.submitScene ??
      vi.fn<SubmitScene>(async () => ({
        spEarned: 10,
        gradedBlocks: [...GRADED],
      })),
    onComplete: vi.fn(),
  };
}

function startLesson(options: LessonOptions = {}) {
  const input = buildInput(options);
  const actor = createActor(lessonProgressionMachine, { input });
  actor.start();
  return {
    actor,
    submitScene: input.submitScene as ReturnType<typeof vi.fn<SubmitScene>>,
    onComplete: input.onComplete as ReturnType<typeof vi.fn>,
  };
}

const sceneIdAt = (actor: LessonActor, index: number) =>
  actor.getSnapshot().context.sceneIds[index]!;

const currentSceneId = (actor: LessonActor) =>
  sceneIdAt(actor, actor.getSnapshot().context.sceneIndex);

function submitCurrentScene(actor: LessonActor, requestId = "req-1") {
  const sceneId = currentSceneId(actor);
  actor.send({
    type: "SUBMIT",
    sceneId,
    command: { requestId, sceneId, blocks: [...ANSWER] },
  });
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("lesson progression machine", () => {
  describe("opening a scene", () => {
    it("LP1: a half-finished lesson opens on the first scene not yet completed", () => {
      const { actor } = startLesson({
        kinds: ["assessment", "assessment", "assessment"],
        completedSceneIds: ["s1"],
        initialSceneIndex: 1,
      });

      expect(currentSceneId(actor)).toBe("s2");
    });

    it("LP1: a scene index beyond the frontier is pulled back to it", () => {
      const { actor } = startLesson({
        kinds: ["assessment", "assessment", "assessment"],
        completedSceneIds: [],
        initialSceneIndex: 2,
      });

      expect(actor.getSnapshot().context.sceneIndex).toBe(0);
    });

    it("LP2: an assessment scene opens ready to answer", () => {
      const { actor } = startLesson({ kinds: ["assessment", "assessment"] });

      expect(
        actor.getSnapshot().matches({ playing: { assessment: "answering" } }),
      ).toBe(true);
    });

    it("LP2: a content scene opens ready to view", () => {
      const { actor } = startLesson({ kinds: ["content", "content"] });

      expect(
        actor.getSnapshot().matches({ playing: { content: "viewing" } }),
      ).toBe(true);
    });

    it("LP3: a scene already completed opens ready to advance, not ready to submit", () => {
      const { actor } = startLesson({
        kinds: ["assessment", "assessment"],
        completedSceneIds: ["s1"],
        initialSceneIndex: 0,
      });

      expect(actor.getSnapshot().hasTag("canAdvance")).toBe(true);
      expect(actor.getSnapshot().hasTag("canSubmit")).toBe(false);
    });

    it("LP3: no submission is sent for a scene already completed", async () => {
      const { actor, submitScene } = startLesson({
        kinds: ["assessment", "assessment"],
        completedSceneIds: ["s1"],
        initialSceneIndex: 0,
      });

      submitCurrentScene(actor);
      await settle();

      expect(submitScene).not.toHaveBeenCalled();
    });

    it("LP4: the last scene, once complete, offers finish rather than advance", () => {
      const { actor } = startLesson({
        kinds: ["assessment", "assessment"],
        completedSceneIds: ["s1", "s2"],
        initialSceneIndex: 1,
      });

      expect(actor.getSnapshot().hasTag("canFinish")).toBe(true);
      expect(actor.getSnapshot().hasTag("canAdvance")).toBe(false);
    });

    it("LP5: a scene with no kind in the published manifest is refused rather than guessed", () => {
      expect(() =>
        createLessonProgressionContext({
          sceneIds: ["s1", "s2"],
          sceneKinds: { s1: "assessment" },
          submitScene: vi.fn<SubmitScene>(),
          onComplete: vi.fn(),
        }),
      ).toThrow(/s2/);
    });
  });

  describe("submitting", () => {
    it("LP9: a content scene may be submitted with nothing answered", async () => {
      const { actor, submitScene } = startLesson({
        kinds: ["content", "content"],
      });
      const sceneId = currentSceneId(actor);

      actor.send({
        type: "SUBMIT",
        sceneId,
        command: { requestId: "req-1", sceneId, blocks: undefined },
      });
      await settle();

      expect(submitScene).toHaveBeenCalledTimes(1);
    });

    it("LP10: a second submission while one is in flight produces no second request", async () => {
      const { submitScene } = deferredSubmit();
      const { actor } = startLesson({ submitScene });

      submitCurrentScene(actor, "req-1");
      submitCurrentScene(actor, "req-2");
      await settle();

      expect(submitScene).toHaveBeenCalledTimes(1);
    });
  });

  describe("after a submission", () => {
    it("LP11: a content scene that is not the last advances immediately", async () => {
      const { actor } = startLesson({ kinds: ["content", "content"] });

      submitCurrentScene(actor);
      await settle();

      expect(currentSceneId(actor)).toBe("s2");
    });

    it("LP12: a content scene that is the last celebrates immediately", async () => {
      const { actor } = startLesson({ kinds: ["content"] });

      submitCurrentScene(actor);
      await settle();

      expect(actor.getSnapshot().matches("celebrating")).toBe(true);
    });

    it("LP13: an assessment scene that is not the last holds the learner on their feedback", async () => {
      const { actor } = startLesson({ kinds: ["assessment", "assessment"] });

      submitCurrentScene(actor);
      await settle();

      expect(currentSceneId(actor)).toBe("s1");
      expect(actor.getSnapshot().hasTag("canAdvance")).toBe(true);
    });

    it("LP13: an assessment scene that is the last holds rather than celebrating", async () => {
      const { actor } = startLesson({ kinds: ["assessment"] });

      submitCurrentScene(actor);
      await settle();

      expect(actor.getSnapshot().matches("celebrating")).toBe(false);
      expect(actor.getSnapshot().hasTag("canFinish")).toBe(true);
    });

    it("LP13a: the learner leaves the feedback state for the next scene by their own action", async () => {
      const { actor } = startLesson({ kinds: ["assessment", "assessment"] });

      submitCurrentScene(actor);
      await settle();
      actor.send({ type: "NEXT", sceneId: currentSceneId(actor) });

      expect(currentSceneId(actor)).toBe("s2");
    });

    it("LP13a: on the last scene the learner finishes by their own action", async () => {
      const { actor } = startLesson({ kinds: ["assessment"] });

      submitCurrentScene(actor);
      await settle();
      actor.send({ type: "FINISH", sceneId: currentSceneId(actor) });

      expect(actor.getSnapshot().matches("celebrating")).toBe(true);
    });

    it("LP14: the lesson reports its completion exactly once", async () => {
      const { actor, onComplete } = startLesson({ kinds: ["assessment"] });

      submitCurrentScene(actor);
      await settle();
      actor.send({ type: "FINISH", sceneId: currentSceneId(actor) });
      actor.send({ type: "FINISH", sceneId: currentSceneId(actor) });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("LP14: the reported SP is what the learner earned this session", async () => {
      const { actor, onComplete } = startLesson({ kinds: ["assessment"] });

      submitCurrentScene(actor);
      await settle();
      actor.send({ type: "FINISH", sceneId: currentSceneId(actor) });

      expect(onComplete).toHaveBeenCalledWith(10);
    });

    it("LP15: the lesson is not complete until the celebration animation reports finished", async () => {
      const { actor } = startLesson({ kinds: ["assessment"] });

      submitCurrentScene(actor);
      await settle();
      actor.send({ type: "FINISH", sceneId: currentSceneId(actor) });

      expect(actor.getSnapshot().status).toBe("active");

      actor.send({ type: "ANIMATION_FINISHED" });

      expect(actor.getSnapshot().status).toBe("done");
    });

    it("LP16: the learner cannot navigate away while a submission is in flight", async () => {
      const { submitScene } = deferredSubmit();
      const { actor } = startLesson({
        kinds: ["assessment", "assessment", "assessment"],
        completedSceneIds: ["s1"],
        initialSceneIndex: 1,
        submitScene,
      });

      submitCurrentScene(actor);
      await settle();
      expect(submitScene).toHaveBeenCalledTimes(1);

      actor.send({
        type: "GO_TO_SCENE",
        sceneId: currentSceneId(actor),
        index: 0,
      });

      expect(actor.getSnapshot().context.sceneIndex).toBe(1);
    });
  });

  describe("when it goes wrong", () => {
    it("LP18: a transport failure returns the learner to the scene they were answering", async () => {
      const submitScene = vi
        .fn<SubmitScene>()
        .mockRejectedValue(new Error("Failed to fetch"));
      const { actor } = startLesson({ submitScene });

      submitCurrentScene(actor);
      await vi.waitFor(() =>
        expect(actor.getSnapshot().context.submissionError).not.toBeNull(),
      );

      expect(
        actor.getSnapshot().matches({ playing: { assessment: "answering" } }),
      ).toBe(true);
    });

    it("LP18: a transport failure leaves the learner's answers in place", async () => {
      const submitScene = vi
        .fn<SubmitScene>()
        .mockRejectedValue(new Error("Failed to fetch"));
      const restored = {
        s1: { sceneId: "s1", blocks: [...ANSWER] },
      } satisfies Record<string, PendingSceneSubmission>;
      const { actor } = startLesson({
        submitScene,
        initialPendingSubmissions: restored,
      });

      submitCurrentScene(actor);
      await settle();

      expect(actor.getSnapshot().context.pendingSubmissions.s1?.blocks).toEqual(
        [...ANSWER],
      );
    });

    it("LP19: a transport failure surfaces an error and does not mark the scene complete", async () => {
      const submitScene = vi
        .fn<SubmitScene>()
        .mockRejectedValue(new Error("Failed to fetch"));
      const { actor } = startLesson({ submitScene });

      submitCurrentScene(actor);
      await vi.waitFor(() =>
        expect(actor.getSnapshot().context.submissionError).not.toBeNull(),
      );

      expect(actor.getSnapshot().context.submissionError).not.toBeNull();
      expect(actor.getSnapshot().context.completedSceneIdsInSession).toEqual(
        {},
      );
    });

    it("LP20: a transport failure is retried automatically three times before the learner is asked", async () => {
      const submitScene = vi
        .fn<SubmitScene>()
        .mockRejectedValue(new Error("Failed to fetch"));
      const { actor } = startLesson({ submitScene });

      submitCurrentScene(actor);
      await vi.waitFor(() =>
        expect(actor.getSnapshot().context.submissionError).not.toBeNull(),
      );

      expect(submitScene).toHaveBeenCalledTimes(4);
    });

    it("LP20: a transport failure that recovers before the retries are exhausted stops retrying", async () => {
      const submitScene = vi
        .fn<SubmitScene>()
        .mockRejectedValueOnce(new Error("Failed to fetch"))
        .mockRejectedValueOnce(new Error("Failed to fetch"))
        .mockResolvedValueOnce({ spEarned: 10, gradedBlocks: [...GRADED] });
      const { actor } = startLesson({ submitScene });

      submitCurrentScene(actor);
      await vi.waitFor(() =>
        expect(actor.getSnapshot().context.completedSceneIdsInSession).toEqual({
          s1: true,
        }),
      );

      expect(submitScene).toHaveBeenCalledTimes(3);
      expect(actor.getSnapshot().context.submissionError).toBeNull();
      expect(actor.getSnapshot().context.retryCount).toBe(0);
    });

    it("LP22: a server rejection is never retried", async () => {
      const rejection = Object.assign(new Error("Scene is out of order."), {
        code: "PREVIOUS_SCENE_INCOMPLETE",
      });
      const submitScene = vi.fn<SubmitScene>().mockRejectedValue(rejection);
      const { actor } = startLesson({ submitScene });

      submitCurrentScene(actor);
      await settle();

      expect(submitScene).toHaveBeenCalledTimes(1);
    });
  });

  describe("review mode", () => {
    it("LP24: every scene is reachable regardless of what was completed", () => {
      const { actor } = startLesson({
        kinds: ["assessment", "assessment", "assessment"],
        completedSceneIds: [],
        initialSceneIndex: 2,
        isReadOnly: true,
      });

      expect(actor.getSnapshot().context.sceneIndex).toBe(2);
    });

    it("LP25: submission is refused", async () => {
      const { actor, submitScene } = startLesson({ isReadOnly: true });

      submitCurrentScene(actor);
      await settle();

      expect(submitScene).not.toHaveBeenCalled();
    });

    it("LP26: a reviewed lesson reports a completion worth nothing", () => {
      const { actor, onComplete } = startLesson({
        kinds: ["assessment"],
        isReadOnly: true,
        initialSessionSP: 40,
      });

      actor.send({ type: "FINISH", sceneId: currentSceneId(actor) });

      expect(onComplete).toHaveBeenCalledWith(0);
    });
  });

  describe("pitch scenes", () => {
    it("PS1: advancing past a pitch completes it locally without a server call", async () => {
      const { actor, submitScene } = startLesson({
        kinds: ["pitch", "content"],
      });

      submitCurrentScene(actor);
      await settle();

      expect(currentSceneId(actor)).toBe("s2");
      expect(submitScene).not.toHaveBeenCalled();
      expect(actor.getSnapshot().context.completedSceneIdsInSession.s1).toBe(
        true,
      );
    });

    it("PS2: resuming past a pitch restores the scene the learner was on", () => {
      // s2 is a pitch the learner passed last session — it has no server-side
      // progress row, so only seeding keeps the frontier at s4.
      const { actor } = startLesson({
        kinds: ["content", "pitch", "content", "content"],
        completedSceneIds: ["s1", "s3"],
        initialSceneIndex: 3,
      });

      expect(currentSceneId(actor)).toBe("s4");
    });

    it("PS3: the strip cannot jump across a pitch not yet viewed", () => {
      const { actor } = startLesson({
        kinds: ["content", "pitch", "content"],
        completedSceneIds: ["s1"],
        initialSceneIndex: 1,
      });

      actor.send({
        type: "GO_TO_SCENE",
        sceneId: currentSceneId(actor),
        index: 2,
      });

      expect(actor.getSnapshot().context.sceneIndex).toBe(1);
    });

    it("PS4: a lesson-end pitch completes the lesson like any final scene", async () => {
      const { actor, submitScene, onComplete } = startLesson({
        kinds: ["content", "pitch"],
        completedSceneIds: ["s1"],
        initialSceneIndex: 1,
      });

      submitCurrentScene(actor);
      await settle();

      expect(actor.getSnapshot().matches("celebrating")).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(submitScene).not.toHaveBeenCalled();
    });
  });

  describe("what the learner sees", () => {
    it("LP27: the learner may go back to a scene they already completed", () => {
      const { actor } = startLesson({
        kinds: ["assessment", "assessment", "assessment"],
        completedSceneIds: ["s1", "s2"],
        initialSceneIndex: 2,
      });

      actor.send({
        type: "GO_TO_SCENE",
        sceneId: currentSceneId(actor),
        index: 0,
      });

      expect(actor.getSnapshot().context.sceneIndex).toBe(0);
    });

    it("LP28: the learner may not jump past the frontier", () => {
      const { actor } = startLesson({
        kinds: ["assessment", "assessment", "assessment"],
        completedSceneIds: [],
      });

      actor.send({
        type: "GO_TO_SCENE",
        sceneId: currentSceneId(actor),
        index: 2,
      });

      expect(actor.getSnapshot().context.sceneIndex).toBe(0);
    });
  });
});

describe("scene results", () => {
  let context: ReturnType<typeof createLessonProgressionContext>;

  beforeEach(() => {
    context = createLessonProgressionContext({
      sceneIds: ["s1", "s2"],
      sceneKinds: { s1: "assessment", s2: "assessment" },
      submitScene: vi.fn<SubmitScene>(),
      onComplete: vi.fn(),
    });
    context.pendingRequest = {
      requestId: "req-1",
      sceneId: "s1",
      blocks: [...ANSWER],
    };
  });

  it("LP17: a result for a request that is no longer current changes nothing", () => {
    const applied = applySceneResult(context, {
      requestId: "req-superseded",
      result: { spEarned: 10, gradedBlocks: [...GRADED] },
    });

    expect(applied).toEqual({});
  });

  it("LP17: the current request's result is applied and its SP counted", () => {
    const applied = applySceneResult(context, {
      requestId: "req-1",
      result: { spEarned: 10, gradedBlocks: [...GRADED] },
    });

    expect(applied.sessionSP).toBe(10);
    expect(applied.completedSceneIdsInSession).toEqual({ s1: true });
  });

  it("LP17: re-applying a result for an already completed scene awards no further SP", () => {
    context.completedSceneIdsInSession = { s1: true };
    context.sessionSP = 10;

    const applied = applySceneResult(context, {
      requestId: "req-1",
      result: { spEarned: 10, gradedBlocks: [...GRADED] },
    });

    expect(applied.sessionSP).toBe(10);
    expect(applied.lastEarnedSP).toBe(0);
  });
});
