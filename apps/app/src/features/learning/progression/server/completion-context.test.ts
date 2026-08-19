import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";
import { EnrollmentStatus } from "@scibly/db/enums";
import { beforeEach, describe, expect, it } from "vitest";

import {
  loadAnonymousCompletionContext,
  loadAuthoritativeSceneIds,
  loadMemberCompletionContext,
} from "./completion-context";

type EnrollmentRow = {
  id: string;
  userId: string;
  courseId: string;
  courseVersionId: string;
  status: EnrollmentStatus;
  triesUsed: number;
  course: { maxTries: number | null };
  courseVersion: { superseded: boolean };
};

type SessionRow = {
  id: string;
  status: EnrollmentStatus;
  triesUsed: number;
  courseVersionId: string;
  scorePct: number | null;
};

interface CompletionContextRows {
  enrollment: EnrollmentRow | null;
  certificate: { id: string } | null;
  sceneProgress: { sceneId: string }[];
  anonymousSession: SessionRow | null;
  sceneAnalytics: { sceneId: string }[];
  lessons: { scenes: { id: string }[] }[];
}

const rows: CompletionContextRows = {
  enrollment: null,
  certificate: null,
  sceneProgress: [],
  anonymousSession: null,
  sceneAnalytics: [],
  lessons: [],
};

vi.mock("@scibly/db", () => ({
  db: {
    courseEnrollment: { findUnique: async () => rows.enrollment },
    certificate: { findFirst: async () => rows.certificate },
    sceneProgress: { findMany: async () => rows.sceneProgress },
    anonymousCourseSession: { findUnique: async () => rows.anonymousSession },
    sceneAnalytics: { findMany: async () => rows.sceneAnalytics },
    lesson: { findMany: async () => rows.lessons },
  },
}));

const OWNER = "user-1";

const enrollment = (overrides: Partial<EnrollmentRow> = {}): EnrollmentRow => ({
  id: "enr-1",
  userId: OWNER,
  courseId: "course-1",
  courseVersionId: "cv-1",
  status: EnrollmentStatus.IN_PROGRESS,
  triesUsed: 0,
  course: { maxTries: 3 },
  courseVersion: { superseded: false },
  ...overrides,
});

const session = (overrides: Partial<SessionRow> = {}): SessionRow => ({
  id: "sess-1",
  status: EnrollmentStatus.IN_PROGRESS,
  triesUsed: 0,
  courseVersionId: "cv-1",
  scorePct: null,
  ...overrides,
});

const loadMember = (userId: string) =>
  loadMemberCompletionContext({ client: db, userId, enrollmentId: "enr-1" });

const loadAnonymous = (courseVersionId: string) =>
  loadAnonymousCompletionContext({
    client: db,
    anonymousId: "anon-1",
    courseVersionId,
    maxTries: 3,
    passingScorePct: 80,
  });

async function refusalCode(load: () => Promise<unknown>): Promise<string> {
  try {
    await load();
  } catch (error) {
    if (error instanceof AppError) return error.code;
    throw error;
  }
  return "resolved";
}

beforeEach(() => {
  rows.enrollment = null;
  rows.certificate = null;
  rows.sceneProgress = [];
  rows.anonymousSession = null;
  rows.sceneAnalytics = [];
  rows.lessons = [];
});

describe("resolving who is completing a scene", () => {
  describe("a member", () => {
    it("SC1: an enrollment belonging to the caller resolves", async () => {
      rows.enrollment = enrollment();

      const context = await loadMember(OWNER);

      expect(context.enrollmentId).toBe("enr-1");
      expect(context.userId).toBe(OWNER);
    });

    it("SC1: another user's enrollment does not resolve", async () => {
      rows.enrollment = enrollment({ userId: "someone-else" });

      await expect(loadMember(OWNER)).rejects.toBeInstanceOf(AppError);
    });

    it("SC2: another user's enrollment and one that does not exist are refused identically", async () => {
      rows.enrollment = enrollment({ userId: "someone-else" });
      const foreign = await refusalCode(() => loadMember(OWNER));

      rows.enrollment = null;
      const absent = await refusalCode(() => loadMember(OWNER));

      expect(foreign).toBe(absent);
      expect(foreign).toBe("NOT_FOUND");
    });

    it("SC22: only the scenes completed in this attempt are carried into the transition", async () => {
      rows.enrollment = enrollment();
      rows.sceneProgress = [{ sceneId: "s1" }, { sceneId: "s2" }];

      const context = await loadMember(OWNER);

      expect([...context.completedSceneIds].sort()).toEqual(["s1", "s2"]);
    });

    it("SC17a: a finished enrollment's pass state is not read from a certificate row", async () => {
      rows.enrollment = enrollment({
        status: EnrollmentStatus.COMPLETED,
        triesUsed: 1,
      });
      rows.certificate = { id: "cert-1" };

      const withCertificate = await loadMember(OWNER);

      rows.certificate = null;
      const withoutCertificate = await loadMember(OWNER);

      expect(withCertificate.status).toBe("finished");
      expect(withoutCertificate.status).toBe("finished");
      expect(withCertificate.passed).toBe(withoutCertificate.passed);
    });
  });

  describe("an anonymous learner", () => {
    it("SC3: a session started in this course version resolves", async () => {
      rows.anonymousSession = session({ courseVersionId: "cv-1" });

      const context = await loadAnonymous("cv-1");

      expect(context.anonymousSessionId).toBe("sess-1");
      expect(context.courseVersionId).toBe("cv-1");
    });

    it("SC3: a session id replayed against another course version does not resolve", async () => {
      rows.anonymousSession = null;

      expect(await refusalCode(() => loadAnonymous("cv-other"))).toBe(
        "NOT_FOUND",
      );
    });

    it("SC22: only the current attempt's scenes are carried into the transition", async () => {
      rows.anonymousSession = session({
        status: EnrollmentStatus.IN_PROGRESS,
        triesUsed: 1,
      });
      rows.sceneAnalytics = [{ sceneId: "s1" }];

      const context = await loadAnonymous("cv-1");

      expect(context.attempt).toBe(2);
      expect([...context.completedSceneIds]).toEqual(["s1"]);
    });

    it("SC17a: pass state is evaluated from the recorded score against the threshold", async () => {
      rows.anonymousSession = session({
        status: EnrollmentStatus.COMPLETED,
        scorePct: 80,
        triesUsed: 1,
      });

      const passing = await loadAnonymous("cv-1");

      rows.anonymousSession = session({
        status: EnrollmentStatus.COMPLETED,
        scorePct: 79,
        triesUsed: 1,
      });
      const failing = await loadAnonymous("cv-1");

      expect(passing.passed).toBe(true);
      expect(failing.passed).toBe(false);
    });
  });

  describe("the order the server enforces", () => {
    it("SC7: the scene order is the course version's own, flattened lesson by lesson", async () => {
      rows.lessons = [
        { scenes: [{ id: "s1" }, { id: "s2" }] },
        { scenes: [{ id: "s3" }] },
      ];

      expect(await loadAuthoritativeSceneIds(db, "cv-1")).toEqual([
        "s1",
        "s2",
        "s3",
      ]);
    });

    it("SC7: a course version with no scenes yields no order rather than failing", async () => {
      rows.lessons = [];

      expect(await loadAuthoritativeSceneIds(db, "cv-1")).toEqual([]);
    });
  });
});
