import { createCallerFactory } from "@scibly/api/trpc";
import { rateLimitCounter } from "@test/mocks/rate-limit-counter";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Real tRPC caller, router, access policies, and rate limiter over a doubled database — mocking the policies would test only that they were called, not who gets through.
const db = vi.hoisted(() => ({
  notebook: { findUnique: vi.fn() },
  member: { findFirst: vi.fn() },
  course: { findUnique: vi.fn() },
  rateLimit: { updateMany: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
  notebookSource: { findMany: vi.fn() },
}));

const ingestion = vi.hoisted(() => ({
  refreshStaleNotebookSources: vi.fn(),
  refreshStaleCourseSources: vi.fn(),
}));

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  db,
}));
vi.mock("../ingestion/refresh-stale-sources", () => ingestion);
// Uploads reach S3 and are specced elsewhere; an empty set keeps that whole
// dependency tree out of this file.
vi.mock("./source-upload-procedures", () => ({ sourceUploadProcedures: {} }));

const { sourceRouter } = await import("./source.router");

const createCaller = createCallerFactory(sourceRouter);

const OWNER = "user-owner";
const STRANGER = "user-stranger";
const ORG = "org-biology";
const NOTEBOOK = "nb-1";
const COURSE = "course-1";
const REFRESH_ENDPOINT = "source.refreshStale";

function caller(userId: string) {
  const now = new Date("2026-01-01T00:00:00Z");
  return createCaller({
    db: db as never,
    headers: new Headers(),
    locale: "en" as const,
    correlationId: "corr-1",
    actor: { userId },
    session: {
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
        name: "Author",
        email: "author@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
}

function expectNothingSpent() {
  expect(ingestion.refreshStaleNotebookSources).not.toHaveBeenCalled();
  expect(ingestion.refreshStaleCourseSources).not.toHaveBeenCalled();
}

async function refusalOf(call: Promise<unknown>): Promise<string> {
  try {
    await call;
  } catch (error) {
    if (error instanceof TRPCError) return error.code;
    throw error;
  }
  throw new Error("the call was allowed through");
}

const live = rateLimitCounter();

beforeEach(() => {
  vi.clearAllMocks();
  live.clear();
  db.rateLimit.updateMany.mockImplementation(live.model.updateMany);
  db.rateLimit.create.mockImplementation(live.model.create);
  db.rateLimit.findUnique.mockImplementation(live.model.findUnique);

  db.notebook.findUnique.mockResolvedValue({
    id: NOTEBOOK,
    userId: OWNER,
    organizationId: ORG,
    organization: { id: ORG },
  });
  db.member.findFirst.mockResolvedValue({
    id: "member-1",
    organizationId: ORG,
    userId: OWNER,
    role: "owner",
  });
  db.course.findUnique.mockResolvedValue({ id: COURSE, organizationId: ORG });
  ingestion.refreshStaleNotebookSources.mockResolvedValue(3);
  ingestion.refreshStaleCourseSources.mockResolvedValue(7);
});

describe("refreshing a notebook's stale sources", () => {
  it("B4: reports how many sources were taken", async () => {
    await expect(
      caller(OWNER).refreshStale({ notebookId: NOTEBOOK }),
    ).resolves.toEqual({ refreshed: 3 });
  });

  it("B1: an author who does not own the notebook cannot refresh it", async () => {
    expect(
      await refusalOf(caller(STRANGER).refreshStale({ notebookId: NOTEBOOK })),
    ).toBe("NOT_FOUND");

    expectNothingSpent();
  });

  it("B1: a member below admin cannot refresh, even in their own organization", async () => {
    db.member.findFirst.mockResolvedValue({
      id: "member-2",
      organizationId: ORG,
      userId: OWNER,
      role: "member",
    });

    expect(
      await refusalOf(caller(OWNER).refreshStale({ notebookId: NOTEBOOK })),
    ).toBe("FORBIDDEN");

    expectNothingSpent();
  });

  it("B2: a refusal leaves the author's refresh allowance untouched", async () => {
    await refusalOf(caller(STRANGER).refreshStale({ notebookId: NOTEBOOK }));

    expect(live.spent(STRANGER, REFRESH_ENDPOINT)).toBe(0);
  });

  it("B5: an author past the allowance is told nothing was refreshed", async () => {
    live.setSpent(OWNER, REFRESH_ENDPOINT, 60);

    await expect(
      caller(OWNER).refreshStale({ notebookId: NOTEBOOK }),
    ).resolves.toEqual({ refreshed: 0 });

    expectNothingSpent();
  });
});

describe("refreshing a whole course's stale sources", () => {
  it("B4: reports how many sources were taken", async () => {
    await expect(
      caller(OWNER).refreshStaleForCourse({ courseId: COURSE }),
    ).resolves.toEqual({ refreshed: 7 });
  });

  it("B3: a member below admin cannot refresh a course", async () => {
    db.member.findFirst.mockResolvedValue({
      id: "member-2",
      organizationId: ORG,
      userId: OWNER,
      role: "member",
    });

    expect(
      await refusalOf(
        caller(OWNER).refreshStaleForCourse({ courseId: COURSE }),
      ),
    ).toBe("FORBIDDEN");

    expectNothingSpent();
  });

  it("B3: an admin of another organization cannot refresh this course", async () => {
    db.member.findFirst.mockResolvedValue(null);

    expect(
      await refusalOf(
        caller(STRANGER).refreshStaleForCourse({ courseId: COURSE }),
      ),
    ).toBe("FORBIDDEN");

    expectNothingSpent();
  });
});

describe("what a refresh costs its author", () => {
  it("B6: a refresh that found nothing owed costs nothing", async () => {
    ingestion.refreshStaleNotebookSources.mockResolvedValue(0);
    await caller(OWNER).refreshStale({ notebookId: NOTEBOOK });

    expect(live.spent(OWNER, REFRESH_ENDPOINT)).toBe(0);

    ingestion.refreshStaleNotebookSources.mockResolvedValue(2);
    await caller(OWNER).refreshStale({ notebookId: NOTEBOOK });

    expect(live.spent(OWNER, REFRESH_ENDPOINT)).toBe(1);
  });

  it("B7: a course refresh and a notebook refresh draw on the same allowance", async () => {
    live.setSpent(OWNER, REFRESH_ENDPOINT, 59);

    await expect(
      caller(OWNER).refreshStaleForCourse({ courseId: COURSE }),
    ).resolves.toEqual({ refreshed: 7 });

    await expect(
      caller(OWNER).refreshStale({ notebookId: NOTEBOOK }),
    ).resolves.toEqual({ refreshed: 0 });
    expect(ingestion.refreshStaleNotebookSources).not.toHaveBeenCalled();
  });
});
