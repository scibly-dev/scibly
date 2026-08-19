import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

// Runs against a doubled `@scibly/db`; no `certificate` table is modelled, proving pass/fail comes from `scorePct` alone.

interface CourseVersionRow {
  id: string;
  courseId: string;
  version: number;
  superseded: boolean;
}

interface EnrollmentRow {
  id: string;
  userId: string;
  courseId: string;
  courseVersionId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  scorePct: number | null;
  triesUsed: number;
  completedAt: Date | null;
  lastActive: Date;
}

interface CourseRow {
  id: string;
  title: string;
  maxTries: number | null;
  passingScorePct: number | null;
  organizationId: string;
}

interface SceneRow {
  id: string;
  courseVersionId: string;
  lessonCourseId: string;
  lessonCourseVersionId: string;
  learnerContent: object;
}

interface World {
  course: CourseRow;
  versions: CourseVersionRow[];
  enrollment: EnrollmentRow;
  scenes: SceneRow[];
  sceneProgressDeletedFor: string[];
  sceneAnalyticsDeletedFor: string[];
}

const COURSE_ID = "course-1";
const USER_ID = "user-1";
const ORG_ID = "org-1";
const CV1 = "cv-1";

function buildWorld(): World {
  return {
    course: {
      id: COURSE_ID,
      title: "Course One",
      maxTries: 3,
      passingScorePct: 80,
      organizationId: ORG_ID,
    },
    versions: [{ id: CV1, courseId: COURSE_ID, version: 1, superseded: false }],
    enrollment: {
      id: "enr-1",
      userId: USER_ID,
      courseId: COURSE_ID,
      courseVersionId: CV1,
      status: "NOT_STARTED",
      scorePct: null,
      triesUsed: 0,
      completedAt: null,
      lastActive: new Date("2026-01-01T00:00:00Z"),
    },
    scenes: [],
    sceneProgressDeletedFor: [],
    sceneAnalyticsDeletedFor: [],
  };
}

let world = buildWorld();

function withIncludes(enrollment: EnrollmentRow) {
  const courseVersion = world.versions.find(
    (v) => v.id === enrollment.courseVersionId,
  );
  if (!courseVersion) throw new Error("test setup: unknown courseVersionId");
  return {
    ...enrollment,
    courseVersion,
    course: { organizationId: world.course.organizationId },
  };
}

vi.mock("@scibly/db", () => ({
  db: {
    courseEnrollment: {
      findFirst: async (args: {
        where: { id?: string; userId?: string; courseId?: string };
      }) => {
        const { id, userId, courseId } = args.where;
        const match =
          (id === undefined || world.enrollment.id === id) &&
          (userId === undefined || world.enrollment.userId === userId) &&
          (courseId === undefined || world.enrollment.courseId === courseId);
        return match ? withIncludes(world.enrollment) : null;
      },
    },
    courseVersion: {
      findFirst: async (args: {
        where: { courseId: string; superseded: boolean };
      }) => {
        const matches = world.versions
          .filter(
            (v) =>
              v.courseId === args.where.courseId &&
              v.superseded === args.where.superseded,
          )
          .sort((a, b) => b.version - a.version);
        return matches[0] ?? null;
      },
    },
    course: {
      findUnique: async (args: { where: { id: string } }) =>
        world.course.id === args.where.id ? { ...world.course } : null,
    },
    scene: {
      findFirst: async (args: {
        where: {
          id: string;
          courseVersionId: string;
          lesson?: { courseId: string; courseVersionId: string };
        };
      }) => {
        const { lesson } = args.where;
        const scene = world.scenes.find(
          (s) =>
            s.id === args.where.id &&
            s.courseVersionId === args.where.courseVersionId &&
            (lesson === undefined ||
              (s.lessonCourseId === lesson.courseId &&
                s.lessonCourseVersionId === lesson.courseVersionId)),
        );
        return scene
          ? { id: scene.id, learnerContent: scene.learnerContent }
          : null;
      },
    },
    $transaction: async (
      run: (tx: unknown) => Promise<unknown>,
    ): Promise<unknown> =>
      run({
        courseEnrollment: {
          findFirst: async (args: { where: { id: string } }) =>
            world.enrollment.id === args.where.id
              ? withIncludes(world.enrollment)
              : null,
          update: async (args: {
            where: { id: string };
            data: Partial<
              Pick<
                EnrollmentRow,
                "courseVersionId" | "status" | "completedAt" | "lastActive"
              >
            >;
          }) => {
            if (world.enrollment.id !== args.where.id) {
              throw new Error("test setup: unknown enrollment id");
            }
            world.enrollment = { ...world.enrollment, ...args.data };
            return withIncludes(world.enrollment);
          },
        },
        sceneProgress: {
          deleteMany: async (args: { where: { enrollmentId: string } }) => {
            world.sceneProgressDeletedFor.push(args.where.enrollmentId);
          },
        },
        sceneAnalytics: {
          deleteMany: async (args: { where: { enrollmentId: string } }) => {
            world.sceneAnalyticsDeletedFor.push(args.where.enrollmentId);
          },
        },
      }),
  },
}));

vi.mock("@/lib/db/transaction-locks", () => ({
  lockEnrollmentAttempt: vi.fn(async () => undefined),
}));

vi.mock("@/features/organizations/server", () => ({
  requireOrgMember: vi.fn(async () => undefined),
}));

const {
  openLearningSession,
  confirmRetryAttempt,
  confirmVersionUpdate,
  getLearnerSceneContent,
} = await import("./learning-session");

beforeEach(() => {
  world = buildWorld();
});

const open = () => openLearningSession(USER_ID, COURSE_ID);
const confirmRetry = () => confirmRetryAttempt(USER_ID, COURSE_ID);
const confirmVersion = () => confirmVersionUpdate(USER_ID, COURSE_ID);

describe("opening a learning session", () => {
  it("LS1: a NOT_STARTED enrollment is silently moved onto a newer, non-superseded version", async () => {
    world.versions.push({
      id: "cv-2",
      courseId: COURSE_ID,
      version: 2,
      superseded: false,
    });

    const result = await open();

    expect(result).toMatchObject({
      courseVersionId: "cv-2",
      pendingAction: null,
    });
  });

  it("LS2: a started enrollment on an superseded version reports version-update instead of switching", async () => {
    world.enrollment.status = "IN_PROGRESS";
    world.versions.push({
      id: "cv-2",
      courseId: COURSE_ID,
      version: 2,
      superseded: false,
    });

    const result = await open();

    expect(result.pendingAction).toBe("version-update");
    expect(result.courseVersionId).toBe(CV1);
    expect(world.sceneProgressDeletedFor).toEqual([]);
  });

  it("LS3: a completed, failed enrollment with tries remaining reports retry instead of reopening", async () => {
    world.enrollment.status = "COMPLETED";
    world.enrollment.scorePct = 50;
    world.enrollment.triesUsed = 1;

    const result = await open();

    expect(result.pendingAction).toBe("retry");
    expect(world.enrollment.status).toBe("COMPLETED");
    expect(world.sceneProgressDeletedFor).toEqual([]);
  });

  it("LS4: a completed enrollment that meets the passing score has no pending action, though no certificate is ever modelled", async () => {
    world.enrollment.status = "COMPLETED";
    world.enrollment.scorePct = 90;
    world.enrollment.triesUsed = 1;

    const result = await open();

    expect(result.pendingAction).toBeNull();
  });

  it("LS5: a completed, failed enrollment that has used all its tries never reports retry", async () => {
    world.enrollment.status = "COMPLETED";
    world.enrollment.scorePct = 50;
    world.enrollment.triesUsed = 3;

    const result = await open();

    expect(result.pendingAction).toBeNull();
  });

  it("LS6: a completed, passing enrollment never reports retry, regardless of tries used", async () => {
    world.enrollment.status = "COMPLETED";
    world.enrollment.scorePct = 80;
    world.enrollment.triesUsed = 3;

    const result = await open();

    expect(result.pendingAction).toBeNull();
  });

  it("LS7: unlimited tries (maxTries null) keeps a failed completed enrollment retry-eligible", async () => {
    world.course.maxTries = null;
    world.enrollment.status = "COMPLETED";
    world.enrollment.scorePct = 50;
    world.enrollment.triesUsed = 999;

    const result = await open();

    expect(result.pendingAction).toBe("retry");
  });

  it("LS8: version-update takes priority over retry when both would otherwise apply", async () => {
    world.enrollment.status = "COMPLETED";
    world.enrollment.scorePct = 50;
    world.enrollment.triesUsed = 1;
    world.versions.push({
      id: "cv-2",
      courseId: COURSE_ID,
      version: 2,
      superseded: false,
    });

    const result = await open();

    expect(result.pendingAction).toBe("version-update");
  });

  it("LS13: a caller only ever sees their own enrollment, never another user's", async () => {
    await expect(
      openLearningSession("someone-else", COURSE_ID),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("confirming a version update", () => {
  it("LS9: performs the wipe-and-switch onto the latest version", async () => {
    world.enrollment.status = "IN_PROGRESS";
    world.versions.push({
      id: "cv-2",
      courseId: COURSE_ID,
      version: 2,
      superseded: false,
    });

    const result = await confirmVersion();

    expect(result.courseVersionId).toBe("cv-2");
    expect(result.status).toBe("NOT_STARTED");
    expect(world.sceneProgressDeletedFor).toEqual(["enr-1"]);
    expect(world.sceneAnalyticsDeletedFor).toEqual(["enr-1"]);
  });

  it("LS12: is a safe no-op when there is no newer version at confirmation time", async () => {
    world.enrollment.status = "IN_PROGRESS";

    const result = await confirmVersion();

    expect(result.courseVersionId).toBe(CV1);
    expect(result.status).toBe("IN_PROGRESS");
    expect(world.sceneProgressDeletedFor).toEqual([]);
  });

  it("LS13: a caller can only confirm their own enrollment", async () => {
    await expect(
      confirmVersionUpdate("someone-else", COURSE_ID),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("confirming a retry", () => {
  it("LS10: performs the wipe-and-reopen for a failed, eligible attempt", async () => {
    world.enrollment.status = "COMPLETED";
    world.enrollment.scorePct = 50;
    world.enrollment.triesUsed = 1;

    const result = await confirmRetry();

    expect(result.status).toBe("IN_PROGRESS");
    expect(world.sceneProgressDeletedFor).toEqual(["enr-1"]);
    expect(world.sceneAnalyticsDeletedFor).toEqual(["enr-1"]);
  });

  it.each([
    {
      name: "LS11: already active",
      setup: (e: EnrollmentRow) => {
        e.status = "IN_PROGRESS";
      },
    },
    {
      name: "LS11: already passed",
      setup: (e: EnrollmentRow) => {
        e.status = "COMPLETED";
        e.scorePct = 90;
        e.triesUsed = 1;
      },
    },
    {
      name: "LS11: no tries remaining",
      setup: (e: EnrollmentRow) => {
        e.status = "COMPLETED";
        e.scorePct = 50;
        e.triesUsed = 3;
      },
    },
  ] as const)(
    "$name: confirming retry is a no-op, not an error",
    async ({ setup }) => {
      setup(world.enrollment);
      const statusBefore = world.enrollment.status;

      const result = await confirmRetry();

      expect(result.status).toBe(statusBefore);
      expect(world.sceneProgressDeletedFor).toEqual([]);
    },
  );

  it("LS13: a caller can only confirm their own enrollment", async () => {
    await expect(
      confirmRetryAttempt("someone-else", COURSE_ID),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("reading scene content", () => {
  const LESSON_ID_ARGS = { courseId: COURSE_ID, courseVersionId: CV1 };

  it("LS14: returns content for a scene belonging to the learner's own course and version", async () => {
    world.scenes.push({
      id: "scene-1",
      courseVersionId: CV1,
      lessonCourseId: LESSON_ID_ARGS.courseId,
      lessonCourseVersionId: LESSON_ID_ARGS.courseVersionId,
      learnerContent: { type: "doc", content: [] },
    });

    const result = await getLearnerSceneContent(USER_ID, COURSE_ID, "scene-1");

    expect(result.sceneId).toBe("scene-1");
  });

  it("LS14: refuses a scene id that belongs to a different course version", async () => {
    world.scenes.push({
      id: "scene-1",
      courseVersionId: "cv-other",
      lessonCourseId: LESSON_ID_ARGS.courseId,
      lessonCourseVersionId: "cv-other",
      learnerContent: { type: "doc", content: [] },
    });

    await expect(
      getLearnerSceneContent(USER_ID, COURSE_ID, "scene-1"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("LS14: refuses a scene id that belongs to a different course entirely", async () => {
    world.scenes.push({
      id: "scene-1",
      courseVersionId: CV1,
      lessonCourseId: "another-course",
      lessonCourseVersionId: CV1,
      learnerContent: { type: "doc", content: [] },
    });

    await expect(
      getLearnerSceneContent(USER_ID, COURSE_ID, "scene-1"),
    ).rejects.toBeInstanceOf(AppError);
  });
});
