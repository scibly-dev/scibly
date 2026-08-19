import type { Prisma } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { EnrollmentStatus } from "@scibly/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_PROGRESS,
  getAnonymousLearnerProgress,
  getMemberLearnerProgress,
} from "./get-learner-progress";

// Only the module-level `db` is mocked; getActiveAttempt, evaluatePassState,
// and requireAnonymousCourse run for real.

type ProgressRow = {
  sceneId: string;
  lessonId: string;
  status: string;
  spEarned: number;
  lesson: { _count: { scenes: number } };
};

type AnalyticsRow = {
  sceneId: string;
  spEarned: number;
  gradedBlocks: unknown;
};

type EnrollmentRow = {
  id: string;
  courseVersionId: string;
  status: EnrollmentStatus;
  triesUsed: number;
};

type SessionRow = {
  id: string;
  status: EnrollmentStatus;
  triesUsed: number;
  scorePct: number | null;
};

type CourseRow = {
  id: string;
  allowAnonymous: boolean;
  passingScorePct: number | null;
  maxTries: number | null;
  title: string;
  thumbnail: string | null;
  organization: { name: string };
};

type VersionRow = {
  id: string;
  lessons: { id: string; scenes: { id: string }[] }[];
};

type Rows = {
  enrollment: EnrollmentRow | null;
  sceneProgress: ProgressRow[];
  sceneAnalytics: AnalyticsRow[];
  certificate: { id: string } | null;
  course: CourseRow | null;
  version: VersionRow | null;
  session: SessionRow | null;
};

const rows: Rows = {
  enrollment: null,
  sceneProgress: [],
  sceneAnalytics: [],
  certificate: null,
  course: null,
  version: null,
  session: null,
};

const queries = {
  sceneAnalytics: vi.fn<(where: Prisma.SceneAnalyticsWhereInput) => void>(),
  sceneProgress: vi.fn<(where: Prisma.SceneProgressWhereInput) => void>(),
};

vi.mock("@scibly/db", () => ({
  db: {
    courseEnrollment: { findUnique: async () => rows.enrollment },
    sceneProgress: {
      findMany: async (args: { where: Prisma.SceneProgressWhereInput }) => {
        queries.sceneProgress(args.where);
        return rows.sceneProgress;
      },
    },
    sceneAnalytics: {
      findMany: async (args: { where: Prisma.SceneAnalyticsWhereInput }) => {
        queries.sceneAnalytics(args.where);
        return rows.sceneAnalytics;
      },
    },
    certificate: { findFirst: async () => rows.certificate },
    course: { findUnique: async () => rows.course },
    courseVersion: { findFirst: async () => rows.version },
    anonymousCourseSession: { findUnique: async () => rows.session },
  },
}));

const OWNER = "user-1";

const enrollment = (overrides: Partial<EnrollmentRow> = {}): EnrollmentRow => ({
  id: "enr-1",
  courseVersionId: "cv-1",
  status: EnrollmentStatus.IN_PROGRESS,
  triesUsed: 0,
  ...overrides,
});

const completedScene = (
  sceneId: string,
  lessonId: string,
  sceneCount: number,
  spEarned = 10,
): ProgressRow => ({
  sceneId,
  lessonId,
  status: "COMPLETED",
  spEarned,
  lesson: { _count: { scenes: sceneCount } },
});

const startedScene = (
  sceneId: string,
  lessonId: string,
  sceneCount: number,
): ProgressRow => ({
  ...completedScene(sceneId, lessonId, sceneCount),
  status: "IN_PROGRESS",
});

const anonymousCourse = (passingScorePct: number | null = 80) => ({
  id: "course-1",
  allowAnonymous: true,
  passingScorePct,
  maxTries: 3,
  title: "Course",
  thumbnail: null,
  organization: { name: "Org" },
});

const session = (overrides: Partial<SessionRow> = {}): SessionRow => ({
  id: "sess-1",
  status: EnrollmentStatus.IN_PROGRESS,
  triesUsed: 0,
  scorePct: null,
  ...overrides,
});

const readMember = () => getMemberLearnerProgress(OWNER, "enr-1");
const readAnonymous = () => getAnonymousLearnerProgress("course-1", "anon-1");

const analyticsWhere = (): Prisma.SceneAnalyticsWhereInput =>
  queries.sceneAnalytics.mock.calls[0]?.[0] ?? {};

beforeEach(() => {
  vi.clearAllMocks();
  rows.enrollment = enrollment();
  rows.sceneProgress = [];
  rows.sceneAnalytics = [];
  rows.certificate = null;
  rows.course = anonymousCourse();
  rows.version = null;
  rows.session = null;
});

describe("reading a learner's progress", () => {
  describe("when nothing has been recorded yet", () => {
    it("SC20: a member who has started nothing reads back an empty course, not an error", async () => {
      rows.sceneProgress = [];
      rows.sceneAnalytics = [];

      const progress = await readMember();

      expect(progress.completedSceneIds).toEqual([]);
      expect(progress.completedLessonIds).toEqual([]);
      expect(progress.totalSP).toBe(0);
      expect(progress.status).toBe(EnrollmentStatus.IN_PROGRESS);
    });

    it("SC20: an anonymous learner with no session reads back the not-started default", async () => {
      rows.version = { id: "cv-1", lessons: [] };
      rows.session = null;

      expect(await readAnonymous()).toEqual(DEFAULT_PROGRESS);
    });

    it("SC20: a course with no published version reads back the not-started default", async () => {
      rows.version = null;

      expect(await readAnonymous()).toEqual(DEFAULT_PROGRESS);
    });

    it("SC20: the not-started default reports NOT_STARTED with no tries used", async () => {
      expect(DEFAULT_PROGRESS.status).toBe("NOT_STARTED");
      expect(DEFAULT_PROGRESS.triesCount).toBe(0);
      expect(DEFAULT_PROGRESS.hasPassed).toBe(false);
    });

    it("SC2: an enrollment that is not the caller's does not resolve", async () => {
      rows.enrollment = null;

      await expect(readMember()).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("rolling scenes up into lessons", () => {
    it("SC21: a lesson with a scene still outstanding is not complete", async () => {
      rows.sceneProgress = [completedScene("s1", "l1", 2)];

      expect((await readMember()).completedLessonIds).toEqual([]);
    });

    it("SC21: a lesson is complete once every one of its scenes is", async () => {
      rows.sceneProgress = [
        completedScene("s1", "l1", 2),
        completedScene("s2", "l1", 2),
      ];

      expect((await readMember()).completedLessonIds).toEqual(["l1"]);
    });

    it("SC21: a scene in progress does not count toward its lesson", async () => {
      rows.sceneProgress = [
        completedScene("s1", "l1", 2),
        startedScene("s2", "l1", 2),
      ];

      const progress = await readMember();

      expect(progress.completedLessonIds).toEqual([]);
      expect(progress.completedSceneIds).toEqual(["s1"]);
    });

    it("SC21: an empty lesson is not complete by default", async () => {
      rows.sceneProgress = [completedScene("s1", "l1", 0)];

      expect((await readMember()).completedLessonIds).toEqual([]);
    });

    it("SC21: only the completed scenes' SP is counted", async () => {
      rows.sceneProgress = [
        completedScene("s1", "l1", 2, 10),
        startedScene("s2", "l1", 2),
      ];

      expect((await readMember()).totalSP).toBe(10);
    });

    it("SC21: an anonymous lesson is complete once every scene has been recorded", async () => {
      rows.version = {
        id: "cv-1",
        lessons: [
          { id: "l1", scenes: [{ id: "s1" }, { id: "s2" }] },
          { id: "l2", scenes: [{ id: "s3" }] },
        ],
      };
      rows.session = session();
      rows.sceneAnalytics = [
        { sceneId: "s1", spEarned: 5, gradedBlocks: [] },
        { sceneId: "s2", spEarned: 5, gradedBlocks: [] },
      ];

      expect((await readAnonymous()).completedLessonIds).toEqual(["l1"]);
    });

    it("SC21: an empty anonymous lesson is not complete by default", async () => {
      rows.version = { id: "cv-1", lessons: [{ id: "l1", scenes: [] }] };
      rows.session = session();
      rows.sceneAnalytics = [];

      expect((await readAnonymous()).completedLessonIds).toEqual([]);
    });
  });

  describe("scoping progress to the current attempt", () => {
    it.each([
      {
        name: "a learner mid-attempt is on the try after the ones they used",
        status: EnrollmentStatus.IN_PROGRESS,
        triesUsed: 1,
        attempt: 2,
      },
      {
        name: "a learner who finished is still on the try that finished",
        status: EnrollmentStatus.COMPLETED,
        triesUsed: 1,
        attempt: 1,
      },
      {
        name: "a learner who has started nothing is on their first try",
        status: EnrollmentStatus.NOT_STARTED,
        triesUsed: 0,
        attempt: 1,
      },
    ])(
      "SC22: $name, and only that attempt's analytics are read",
      async ({ status, triesUsed, attempt }) => {
        rows.enrollment = enrollment({ status, triesUsed });

        await readMember();

        expect(analyticsWhere()).toEqual({ enrollmentId: "enr-1", attempt });
      },
    );

    it("SC22: an anonymous learner's analytics are scoped to their session's attempt", async () => {
      rows.version = { id: "cv-1", lessons: [] };
      rows.session = session({
        status: EnrollmentStatus.IN_PROGRESS,
        triesUsed: 2,
      });

      await readAnonymous();

      expect(analyticsWhere()).toEqual({
        anonymousSessionId: "sess-1",
        attempt: 3,
      });
    });

    it("SC22: the scenes reported complete are scoped to the current attempt (F3)", async () => {
      rows.enrollment = enrollment({
        status: EnrollmentStatus.IN_PROGRESS,
        triesUsed: 1,
      });

      await readMember();

      expect(queries.sceneProgress.mock.calls[0]?.[0]).toMatchObject({
        attempt: 2,
      });
    });
  });

  describe("reporting whether the learner passed", () => {
    it("SC17a: a member's pass state is not read from a certificate row (F4)", async () => {
      rows.enrollment = enrollment({
        status: EnrollmentStatus.COMPLETED,
        triesUsed: 1,
      });
      rows.certificate = { id: "cert-1" };
      const withCertificate = await readMember();

      rows.certificate = null;
      const withoutCertificate = await readMember();

      expect(withCertificate.hasPassed).toBe(withoutCertificate.hasPassed);
    });

    it("SC17a: an anonymous learner's pass state is evaluated from their recorded score", async () => {
      rows.version = { id: "cv-1", lessons: [] };
      rows.course = anonymousCourse(80);
      rows.session = session({
        status: EnrollmentStatus.COMPLETED,
        scorePct: 80,
        triesUsed: 1,
      });
      const passing = await readAnonymous();

      rows.session = session({
        status: EnrollmentStatus.COMPLETED,
        scorePct: 79,
        triesUsed: 1,
      });
      const failing = await readAnonymous();

      expect(passing.hasPassed).toBe(true);
      expect(failing.hasPassed).toBe(false);
    });

    it("SC17a: an unfinished course has not been passed, whatever the score so far", async () => {
      rows.version = { id: "cv-1", lessons: [] };
      rows.session = session({
        status: EnrollmentStatus.IN_PROGRESS,
        scorePct: 100,
      });

      expect((await readAnonymous()).hasPassed).toBe(false);
    });
  });
});
