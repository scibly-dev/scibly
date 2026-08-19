import type {
  AnonymousCompletionContext,
  MemberCompletionContext,
} from "./completion-context";
import type { SceneGradingResult } from "./grading";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";

import { completeAnonymousScene, completeMemberScene } from "./complete-scene";

/**
 * Exercises `completeMemberScene`/`completeAnonymousScene` with the transition
 * rules (`transitionAttempt`, `getSequenceViolation`) real; db, context
 * loaders, grading and persistence are doubled.
 */

const ORDER = ["s1", "s2", "s3"];

interface CompleteSceneState {
  memberContext: MemberCompletionContext;
  anonymousContext: AnonymousCompletionContext;
  grading: SceneGradingResult;
  gradingError: Error | null;
  persistError: Error | null;
}

const state: CompleteSceneState = {
  memberContext: buildMemberContext(),
  anonymousContext: buildAnonymousContext(),
  grading: buildGrading(),
  gradingError: null,
  persistError: null,
};

function buildMemberContext(
  overrides: Partial<MemberCompletionContext> = {},
): MemberCompletionContext {
  return {
    courseVersionId: "cv-1",
    attempt: 1,
    completedSceneIds: new Set<string>(),
    enrollmentId: "enr-1",
    userId: "user-1",
    courseId: "course-1",
    status: "active",
    passed: false,
    triesUsed: 0,
    maxTries: 3,
    ...overrides,
  };
}

function buildAnonymousContext(
  overrides: Partial<AnonymousCompletionContext> = {},
): AnonymousCompletionContext {
  return {
    courseVersionId: "cv-1",
    attempt: 1,
    completedSceneIds: new Set<string>(),
    anonymousSessionId: "sess-1",
    status: "active",
    passed: false,
    triesUsed: 0,
    maxTries: 3,
    ...overrides,
  };
}

function buildGrading(
  overrides: Partial<SceneGradingResult> = {},
): SceneGradingResult {
  return {
    sceneId: "s1",
    lessonId: "lesson-1",
    courseVersionId: "cv-1",
    spEarned: 10,
    gradedBlocks: [
      {
        blockId: "b1",
        blockType: INPUT_FIELD_NODE_NAME,
        achievedPoints: 1,
        maxPoints: 1,
        spEarned: 10,
      },
    ],
    ...overrides,
  };
}

const transactionsCommitted = vi.fn();

vi.mock("@scibly/db", () => ({
  db: {
    $transaction: async (run: (tx: unknown) => Promise<unknown>) => {
      const result = await run({});
      transactionsCommitted();
      return result;
    },
  },
}));

vi.mock("@/lib/db/transaction-locks", () => ({
  lockEnrollmentAttempt: vi.fn(async () => undefined),
  lockAnonymousAttempt: vi.fn(async () => undefined),
}));

vi.mock("../../public-course/server/public-course", () => ({
  requireAnonymousCourse: vi.fn(async () => ({
    maxTries: 3,
    passingScorePct: 80,
  })),
  getLatestCourseVersion: vi.fn(async () => ({ id: "cv-1" })),
}));

vi.mock("../../public-course/server/anonymous-session", () => ({
  withAnonymousGradingRateLimit: vi.fn(
    async (
      _headers: Headers,
      _anonymousId: string,
      _key: string,
      run: () => Promise<unknown>,
    ) => run(),
  ),
}));

vi.mock("./completion-context", () => ({
  loadMemberCompletionContext: vi.fn(async () => state.memberContext),
  loadAnonymousCompletionContext: vi.fn(async () => state.anonymousContext),
  loadAuthoritativeSceneIds: vi.fn(async () => ORDER),
}));

vi.mock("./grading", () => ({
  gradeSceneSubmissions: vi.fn(async () => {
    if (state.gradingError) throw state.gradingError;
    return { results: [state.grading], totalSpEarned: state.grading.spEarned };
  }),
  persistAnonymousSceneAnalytics: vi.fn(async () => {
    if (state.persistError) throw state.persistError;
  }),
}));

vi.mock("./persist-completion", () => ({
  persistMemberSceneCompletion: vi.fn(async () => {
    if (state.persistError) throw state.persistError;
  }),
}));

vi.mock("./finish-member-course", () => ({
  finishMemberCourseWhenComplete: vi.fn(async () => undefined),
}));

const { gradeSceneSubmissions, persistAnonymousSceneAnalytics } =
  await import("./grading");
const { persistMemberSceneCompletion } = await import("./persist-completion");
const { finishMemberCourseWhenComplete } =
  await import("./finish-member-course");
const { loadAuthoritativeSceneIds } = await import("./completion-context");

const MEMBER = { userId: "user-1", enrollmentId: "enr-1" };
const ANONYMOUS = { courseId: "course-1", anonymousId: "anon-1" };
const INPUT = { lessonId: "lesson-1", sceneId: "s1", blocks: [] };

const completeMember = (sceneId: string) =>
  completeMemberScene(MEMBER, { ...INPUT, sceneId });

const completeAnonymous = (sceneId: string) =>
  completeAnonymousScene(new Headers(), ANONYMOUS, { ...INPUT, sceneId });

async function refusal(
  call: () => Promise<unknown>,
): Promise<{ code: string; message: string }> {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) {
      return { code: error.code, message: error.message };
    }
    throw error;
  }
  return { code: "resolved", message: "" };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.memberContext = buildMemberContext();
  state.anonymousContext = buildAnonymousContext();
  state.grading = buildGrading();
  state.gradingError = null;
  state.persistError = null;
});

describe("completing a scene", () => {
  describe("applying the transition", () => {
    it("SC7: the order checked is the course version's, not the caller's", async () => {
      await completeMember("s1");

      expect(loadAuthoritativeSceneIds).toHaveBeenCalledWith(
        expect.anything(),
        "cv-1",
      );
    });

    it("SC13: an accepted completion is recorded against the attempt currently active", async () => {
      state.memberContext = buildMemberContext({ attempt: 3 });

      await completeMember("s1");

      expect(persistMemberSceneCompletion).toHaveBeenCalledWith(
        expect.anything(),
        "enr-1",
        expect.objectContaining({ attempt: 3, lessonId: "lesson-1" }),
      );
    });

    it("SC13: an accepted completion returns the SP it earned", async () => {
      const result = await completeMember("s1");

      expect(result.spEarned).toBe(10);
    });

    it("SC8: a scene whose predecessor is incomplete is raised, never returned as a success", async () => {
      await expect(completeMember("s2")).rejects.toBeInstanceOf(AppError);
    });

    it("SC10: a refused completion writes nothing", async () => {
      await refusal(() => completeMember("s2"));

      expect(persistMemberSceneCompletion).not.toHaveBeenCalled();
      expect(finishMemberCourseWhenComplete).not.toHaveBeenCalled();
    });

    it.each([
      {
        name: "SC9: a scene out of order is distinguishable from one that does not exist",
        context: buildMemberContext(),
        sceneId: "s2",
        other: { context: buildMemberContext(), sceneId: "unknown-scene" },
      },
      {
        name: "SC9: a finished attempt is distinguishable from a scene out of order",
        context: buildMemberContext({
          status: "finished",
          triesUsed: 1,
          completedSceneIds: new Set(["s1", "s2"]),
        }),
        sceneId: "s3",
        other: { context: buildMemberContext(), sceneId: "s2" },
      },
    ])("$name", async ({ context, sceneId, other }) => {
      state.memberContext = context;
      const first = await refusal(() => completeMember(sceneId));

      state.memberContext = other.context;
      const second = await refusal(() => completeMember(other.sceneId));

      expect(first.code).not.toBe(second.code);
    });

    it("SC11: a scene already completed in this attempt is reported complete so the learner can advance", async () => {
      state.memberContext = buildMemberContext({
        completedSceneIds: new Set(["s1"]),
      });

      const result = await completeMember("s1");

      expect(result.success).toBe(true);
    });

    it("SC11: a scene already completed awards no further SP", async () => {
      state.memberContext = buildMemberContext({
        completedSceneIds: new Set(["s1"]),
      });

      const result = await completeMember("s1");

      expect(result.spEarned).toBe(0);
    });

    it("SC11: a scene already completed writes nothing and is not re-graded", async () => {
      state.memberContext = buildMemberContext({
        completedSceneIds: new Set(["s1"]),
      });

      await completeMember("s1");

      expect(gradeSceneSubmissions).not.toHaveBeenCalled();
      expect(persistMemberSceneCompletion).not.toHaveBeenCalled();
      expect(finishMemberCourseWhenComplete).not.toHaveBeenCalled();
    });

    it("SC11: a finished attempt refuses even a scene it already completed, rather than reporting success (AT5)", async () => {
      state.memberContext = buildMemberContext({
        status: "finished",
        triesUsed: 1,
        completedSceneIds: new Set(ORDER),
      });

      await expect(completeMember("s1")).rejects.toBeInstanceOf(AppError);
    });

    it("SC15: an accepted completion asks whether the course is now finished, inside the same transaction", async () => {
      await completeMember("s1");

      expect(finishMemberCourseWhenComplete).toHaveBeenCalledTimes(1);
      expect(transactionsCommitted).toHaveBeenCalledTimes(1);
      expect(
        vi.mocked(finishMemberCourseWhenComplete).mock.invocationCallOrder[0]!,
      ).toBeLessThan(
        vi.mocked(transactionsCommitted).mock.invocationCallOrder[0]!,
      );
    });

    it("SC14: a grading failure leaves the transaction uncommitted, so nothing is recorded", async () => {
      state.gradingError = new Error("grading exploded");

      await expect(completeMember("s1")).rejects.toThrow("grading exploded");
      expect(persistMemberSceneCompletion).not.toHaveBeenCalled();
      expect(transactionsCommitted).not.toHaveBeenCalled();
    });

    it("SC14: a persistence failure leaves the transaction uncommitted, so the scene is not finishable", async () => {
      state.persistError = new Error("write exploded");

      await expect(completeMember("s1")).rejects.toThrow("write exploded");
      expect(finishMemberCourseWhenComplete).not.toHaveBeenCalled();
      expect(transactionsCommitted).not.toHaveBeenCalled();
    });

    it("SC13: a scene belonging to another lesson is refused rather than recorded against this one", async () => {
      state.grading = buildGrading({ lessonId: "another-lesson" });

      await expect(completeMember("s1")).rejects.toBeInstanceOf(AppError);
      expect(persistMemberSceneCompletion).not.toHaveBeenCalled();
    });

    it("SC13: a scene from another course version is refused", async () => {
      state.grading = buildGrading({ courseVersionId: "cv-other" });

      await expect(completeMember("s1")).rejects.toBeInstanceOf(AppError);
      expect(persistMemberSceneCompletion).not.toHaveBeenCalled();
    });
  });

  describe("an anonymous learner", () => {
    it("SC12: the first scene of the course is accepted, exactly as it is for a member", async () => {
      const result = await completeAnonymous("s1");

      expect(result.success).toBe(true);
      expect(persistAnonymousSceneAnalytics).toHaveBeenCalledTimes(1);
    });

    it("SC12: a scene out of order is refused with the same code a member receives", async () => {
      state.memberContext = buildMemberContext();
      const memberRefusal = await refusal(() => completeMember("s2"));

      const anonymousRefusal = await refusal(() => completeAnonymous("s2"));

      expect(anonymousRefusal).toEqual(memberRefusal);
    });

    it("SC12: a finished session is refused, and writes nothing", async () => {
      state.anonymousContext = buildAnonymousContext({
        status: "finished",
        triesUsed: 1,
        completedSceneIds: new Set(["s1", "s2"]),
      });

      await expect(completeAnonymous("s3")).rejects.toBeInstanceOf(AppError);
      expect(persistAnonymousSceneAnalytics).not.toHaveBeenCalled();
    });

    it("SC11: a scene already completed in this session awards no further SP", async () => {
      state.anonymousContext = buildAnonymousContext({
        completedSceneIds: new Set(["s1"]),
      });

      const result = await completeAnonymous("s1");

      expect(result.spEarned).toBe(0);
      expect(persistAnonymousSceneAnalytics).not.toHaveBeenCalled();
    });

    it("SC4: an anonymous completion goes through the rate limiter", async () => {
      const { withAnonymousGradingRateLimit } =
        await import("../../public-course/server/anonymous-session");

      await completeAnonymous("s1");

      expect(withAnonymousGradingRateLimit).toHaveBeenCalledTimes(1);
      expect(withAnonymousGradingRateLimit).toHaveBeenCalledWith(
        expect.anything(),
        "anon-1",
        "anon.gradeScene",
        expect.any(Function),
      );
    });
  });
});
