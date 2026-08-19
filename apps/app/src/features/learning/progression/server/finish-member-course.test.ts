import { db } from "@scibly/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { finishMemberCourseWhenComplete } from "./finish-member-course";

/**
 * `db` is mocked; `computeScorePct`/`passesScore`/`hasAttemptsRemaining` stay
 * real since the finish decision is their composition. `computeCourseMaxSp`
 * is doubled as a query, not a decision.
 */

interface FinishCourseState {
  totalScenes: number;
  completedSp: number[];
  enrollment: {
    id: string;
    triesUsed: number;
    course: {
      id: string;
      title: string;
      organizationId: string;
      passingScorePct: number | null;
      maxTries: number | null;
    };
    user: { name: string } | null;
  } | null;
  possibleSp: number;
}

const state: FinishCourseState = {
  totalScenes: 2,
  completedSp: [],
  enrollment: null,
  possibleSp: 100,
};

const writes = {
  enrollmentUpdate: vi.fn(),
  certificateCreate: vi.fn(),
};

vi.mock("@scibly/db", () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
  db: {
    scene: { count: vi.fn(async () => state.totalScenes) },
    sceneProgress: {
      findMany: vi.fn(async () =>
        state.completedSp.map((spEarned) => ({ spEarned })),
      ),
    },
    courseEnrollment: {
      findUnique: vi.fn(async () => state.enrollment),
      update: vi.fn(async (args: { data: { triesUsed?: unknown } }) => {
        writes.enrollmentUpdate(args);
        return {
          ...state.enrollment,
          triesUsed: (state.enrollment?.triesUsed ?? 0) + 1,
        };
      }),
    },
    courseVersion: { findUnique: vi.fn(async () => ({ version: 1 })) },
    certificate: {
      create: vi.fn(async (args: unknown) => {
        writes.certificateCreate(args);
      }),
    },
  },
}));

vi.mock("./grading", () => ({
  computeCourseMaxSp: vi.fn(async () => state.possibleSp),
}));

const CONTEXT = {
  enrollmentId: "enr-1",
  courseVersionId: "cv-1",
  userId: "user-1",
};

function enrollment(
  course: { passingScorePct: number | null; maxTries: number | null },
  triesUsed = 0,
) {
  return {
    id: "enr-1",
    triesUsed,
    course: {
      id: "course-1",
      title: "Course",
      organizationId: "org-1",
      ...course,
    },
    user: { name: "Learner" },
  };
}

const enrollmentUpdateData = () =>
  writes.enrollmentUpdate.mock.calls[0]?.[0]?.data ?? {};

beforeEach(() => {
  vi.clearAllMocks();
  state.totalScenes = 2;
  state.completedSp = [];
  state.enrollment = enrollment({ passingScorePct: 80, maxTries: 3 });
  state.possibleSp = 100;
});

describe("finishing a course", () => {
  describe("deciding whether it is finished", () => {
    it("SC16: a course with a scene still outstanding is not finished", async () => {
      state.totalScenes = 3;
      state.completedSp = [40, 40];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(enrollmentUpdateData().status).toBe("IN_PROGRESS");
      expect(enrollmentUpdateData().completedAt).toBeNull();
    });

    it("SC16: an outstanding scene consumes no try", async () => {
      state.totalScenes = 3;
      state.completedSp = [40, 40];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(enrollmentUpdateData().triesUsed).toBeUndefined();
    });

    it("SC15: completing the final outstanding scene finishes the course", async () => {
      state.totalScenes = 2;
      state.completedSp = [40, 40];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(enrollmentUpdateData().status).toBe("COMPLETED");
      expect(enrollmentUpdateData().completedAt).toBeInstanceOf(Date);
    });

    it("SC17: finishing consumes exactly one try", async () => {
      state.completedSp = [40, 40];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(enrollmentUpdateData().triesUsed).toEqual({ increment: 1 });
    });

    it("SC19: completeness is measured against the enrollment's own course version", async () => {
      state.completedSp = [40, 40];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(vi.mocked(db.scene.count)).toHaveBeenCalledWith({
        where: { courseVersionId: "cv-1" },
      });
    });

    it("SC15: an enrollment that has vanished is left alone rather than written to", async () => {
      state.enrollment = null;
      state.completedSp = [40, 40];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(writes.enrollmentUpdate).not.toHaveBeenCalled();
    });
  });

  describe("recording the result", () => {
    it("SC17: the final score is recorded on the enrollment, so a later course edit cannot move it", async () => {
      state.completedSp = [40, 40];
      state.possibleSp = 100;

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(enrollmentUpdateData().scorePct).toBe(80);
    });

    it("SC17: a course with nothing gradable records a full score (AT13)", async () => {
      state.completedSp = [0, 0];
      state.possibleSp = 0;

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(enrollmentUpdateData().scorePct).toBe(100);
    });

    it("SC18: a finish below the threshold is still a finish", async () => {
      state.completedSp = [40, 30];
      state.possibleSp = 100;

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(enrollmentUpdateData().status).toBe("COMPLETED");
      expect(enrollmentUpdateData().scorePct).toBe(70);
    });

    it("SC18: a finish below the threshold does not reopen the attempt for the learner", async () => {
      state.completedSp = [40, 30];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(enrollmentUpdateData().status).not.toBe("IN_PROGRESS");
      expect(enrollmentUpdateData().triesUsed).toEqual({ increment: 1 });
    });

    it("SC17a: a learner at the threshold is issued the certificate their score earned", async () => {
      state.completedSp = [40, 40];
      state.possibleSp = 100;
      state.enrollment = enrollment({ passingScorePct: 80, maxTries: 3 });

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(writes.certificateCreate).toHaveBeenCalledTimes(1);
    });

    it("SC17a: a learner below the threshold is issued none", async () => {
      state.completedSp = [40, 30];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(writes.certificateCreate).not.toHaveBeenCalled();
    });

    it("SC17a: a course with no threshold certifies anyone who finishes it (AT11)", async () => {
      state.completedSp = [0, 0];
      state.possibleSp = 100;
      state.enrollment = enrollment({ passingScorePct: null, maxTries: 3 });

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(writes.certificateCreate).toHaveBeenCalledTimes(1);
    });

    it("SC17: the learner's earned SP is carried onto the certificate", async () => {
      state.completedSp = [40, 40];

      await finishMemberCourseWhenComplete(db, CONTEXT);

      expect(writes.certificateCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalSpEarned: 80 }),
        }),
      );
    });
  });
});
