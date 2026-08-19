import { createCallerFactory } from "@scibly/api/trpc";
import { db } from "@scibly/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sceneProgressRouter } from "./scene-progress.router";

// Router and auth guard run for real; the handlers behind them are mocked since they have their own specs.

vi.mock("@scibly/db", () => ({ db: {} }));

vi.mock("@/features/learning/server", () => ({
  completeMemberScene: vi.fn(async () => ({ success: true, spEarned: 0 })),
  completeAnonymousScene: vi.fn(async () => ({ success: true, spEarned: 0 })),
  getMemberLearnerProgress: vi.fn(async () => ({ totalSP: 0 })),
  getMemberLearnerProgressByCourseId: vi.fn(async () => ({ totalSP: 0 })),
  getAnonymousLearnerProgress: vi.fn(async () => ({ totalSP: 0 })),
  previewScene: vi.fn(async () => ({ gradedBlocks: [] })),
  startAnonymousLearningSession: vi.fn(async () => ({ id: "sess-1" })),
  completeAnonymousLearningSession: vi.fn(async () => ({ success: true })),
}));

const {
  completeAnonymousScene,
  completeMemberScene,
  getAnonymousLearnerProgress,
  getMemberLearnerProgress,
  getMemberLearnerProgressByCourseId,
} = await import("@/features/learning/server");

const createCaller = createCallerFactory(sceneProgressRouter);

function session(userId: string) {
  const now = new Date("2026-01-01T00:00:00Z");
  return {
    session: {
      id: "sess-1",
      createdAt: now,
      updatedAt: now,
      userId,
      expiresAt: new Date("2026-12-31T00:00:00Z"),
      token: "token",
    },
    user: {
      id: userId,
      name: "Learner",
      email: "learner@example.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  };
}

function caller(userId: string | null) {
  return createCaller({
    db,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    session: userId ? session(userId) : null,
    actor: userId ? { userId } : null,
  });
}

const SIGNED_IN = () => caller("user-1");
const SIGNED_OUT = () => caller(null);

const SCENE = { lessonId: "lesson-1", sceneId: "s1", blocks: [] };

async function refusalCode(call: () => Promise<unknown>): Promise<string> {
  try {
    await call();
  } catch (error) {
    if (error instanceof Error && "code" in error) return String(error.code);
    throw error;
  }
  return "resolved";
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the scene progress router", () => {
  describe("completing a scene", () => {
    it("SC5: an enrollment-scoped completion from a caller with no session is refused", async () => {
      expect(
        await refusalCode(() =>
          SIGNED_OUT().completeScene({ ...SCENE, enrollmentId: "enr-1" }),
        ),
      ).toBe("UNAUTHORIZED");
    });

    it("SC5: a refused call never reaches the handler", async () => {
      await refusalCode(() =>
        SIGNED_OUT().completeScene({ ...SCENE, enrollmentId: "enr-1" }),
      );

      expect(completeMemberScene).not.toHaveBeenCalled();
      expect(completeAnonymousScene).not.toHaveBeenCalled();
    });

    it("SC5: the identity used is the session's, never one supplied in the request", async () => {
      await SIGNED_IN().completeScene({ ...SCENE, enrollmentId: "enr-1" });

      expect(completeMemberScene).toHaveBeenCalledWith(
        { userId: "user-1", enrollmentId: "enr-1" },
        expect.objectContaining({ sceneId: "s1" }),
      );
    });

    it("SC6: a request carrying both identities takes the member path, and is authenticated", async () => {
      await SIGNED_IN().completeScene({
        ...SCENE,
        enrollmentId: "enr-1",
        courseId: "course-1",
        anonymousId: "anon-1",
      });

      expect(completeMemberScene).toHaveBeenCalledTimes(1);
      expect(completeAnonymousScene).not.toHaveBeenCalled();
    });

    it("SC6: a request carrying both identities cannot use the anonymous path to skip the auth check", async () => {
      expect(
        await refusalCode(() =>
          SIGNED_OUT().completeScene({
            ...SCENE,
            enrollmentId: "enr-1",
            courseId: "course-1",
            anonymousId: "anon-1",
          }),
        ),
      ).toBe("UNAUTHORIZED");
    });

    it("SC6: a request with no enrollment id takes the anonymous path", async () => {
      await SIGNED_OUT().completeScene({
        ...SCENE,
        courseId: "course-1",
        anonymousId: "anon-1",
      });

      expect(completeAnonymousScene).toHaveBeenCalledTimes(1);
      expect(completeMemberScene).not.toHaveBeenCalled();
    });

    it("SC6: a request naming neither identity is refused before any handler runs", async () => {
      await refusalCode(() => SIGNED_OUT().completeScene(SCENE));

      expect(completeAnonymousScene).not.toHaveBeenCalled();
      expect(completeMemberScene).not.toHaveBeenCalled();
    });
  });

  describe("reading progress", () => {
    it("SC5: an enrollment-scoped read from a caller with no session is refused", async () => {
      expect(
        await refusalCode(() =>
          SIGNED_OUT().getLearnerProgress({ enrollmentId: "enr-1" }),
        ),
      ).toBe("UNAUTHORIZED");
    });

    it("SC5: the read is scoped to the session's user", async () => {
      await SIGNED_IN().getLearnerProgress({ enrollmentId: "enr-1" });

      expect(getMemberLearnerProgress).toHaveBeenCalledWith("user-1", "enr-1");
    });

    it("SC6: a read with no enrollment id takes the anonymous path", async () => {
      await SIGNED_OUT().getLearnerProgress({
        courseId: "course-1",
        anonymousId: "anon-1",
      });

      expect(getAnonymousLearnerProgress).toHaveBeenCalledWith(
        "course-1",
        "anon-1",
      );
      expect(getMemberLearnerProgress).not.toHaveBeenCalled();
    });

    it("a courseId-only read from a signed-in caller takes the member fast path", async () => {
      await SIGNED_IN().getLearnerProgress({ courseId: "course-1" });

      expect(getMemberLearnerProgressByCourseId).toHaveBeenCalledWith(
        "user-1",
        "course-1",
      );
      expect(getMemberLearnerProgress).not.toHaveBeenCalled();
      expect(getAnonymousLearnerProgress).not.toHaveBeenCalled();
    });

    it("a courseId-only read from a caller with no session is refused", async () => {
      expect(
        await refusalCode(() =>
          SIGNED_OUT().getLearnerProgress({ courseId: "course-1" }),
        ),
      ).toBe("UNAUTHORIZED");

      expect(getMemberLearnerProgressByCourseId).not.toHaveBeenCalled();
    });
  });
});
