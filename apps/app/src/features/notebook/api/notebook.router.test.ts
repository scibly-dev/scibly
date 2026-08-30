import { AppError } from "@scibly/api/application-error";
import { createCallerFactory } from "@scibly/api/trpc";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The notebook-access boundary functions are mocked here since their own suite covers them; these tests focus on caller identity and post-boundary behavior.

const db = vi.hoisted(() => ({
  notebook: { findMany: vi.fn(), delete: vi.fn(), update: vi.fn() },
  course: { delete: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
}));

const notebookServer = vi.hoisted(() => ({
  ensureNotebook: vi.fn(),
  getNotebookDetailInOrg: vi.fn(),
  getNotebookMetaInOrg: vi.fn(),
  listOlderNotebookMessages: vi.fn(),
  resolveNotebookInOrg: vi.fn(),
}));

const orgPolicy = vi.hoisted(() => ({ resolveOrg: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/notebook/server", () => notebookServer);
vi.mock("@/features/organizations/server", () => orgPolicy);

// The two sub-routers are mounted here but specced elsewhere; an empty router
// keeps their dependency trees (S3, the digest model) out of this file.
vi.mock("../sources/api/source.router", async () => {
  const { createTRPCRouter } = await import("@scibly/api/trpc");
  return { sourceRouter: createTRPCRouter({}) };
});
vi.mock("../media/api/generated-image.router", async () => {
  const { createTRPCRouter } = await import("@scibly/api/trpc");
  return { generatedImageRouter: createTRPCRouter({}) };
});

const { db: prisma } = await import("@scibly/db");
const { notebookRouter } = await import("./notebook.router");

const createCaller = createCallerFactory(notebookRouter);

const OWNER = "user-owner";
const ORG_A = "org-a";
const ORG_SLUG = "org-a-slug";

function caller(userId: string) {
  const now = new Date("2026-01-01T00:00:00Z");
  return createCaller({
    db: prisma,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    actor: { userId },
    session: {
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

function notebookNotFound() {
  return new AppError({
    code: "NOT_FOUND",
    applicationCode: "api.not_found",
    message: "Notebook not found.",
  });
}

async function refusalCode(call: () => Promise<unknown>) {
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
  orgPolicy.resolveOrg.mockResolvedValue({
    organization: { id: ORG_A },
    membership: {
      id: "mem-1",
      organizationId: ORG_A,
      userId: OWNER,
      role: "admin",
    },
  });
});

describe("listing notebooks", () => {
  it("NA7: enumerates only the caller's own notebooks in the named organization", async () => {
    db.notebook.findMany.mockResolvedValueOnce([]);

    await caller(OWNER).list({ orgSlug: ORG_SLUG });

    expect(db.notebook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG_A, userId: OWNER },
      }),
    );
  });

  it("NA7: enumerates under the session's identity, never one named in the request", async () => {
    db.notebook.findMany.mockResolvedValueOnce([]);

    await caller("user-someone-else").list({ orgSlug: ORG_SLUG });

    expect(db.notebook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-someone-else" }),
      }),
    );
    expect(orgPolicy.resolveOrg).toHaveBeenCalledWith(
      ORG_SLUG,
      "user-someone-else",
    );
  });
});

describe("paging back through a conversation", () => {
  it("NC3: never reaches the messages when the notebook boundary refuses", async () => {
    notebookServer.resolveNotebookInOrg.mockRejectedValueOnce(
      notebookNotFound(),
    );

    expect(
      await refusalCode(() =>
        caller(OWNER).listOlderMessages({
          notebookId: "nb-of-another-user",
          orgSlug: ORG_SLUG,
          beforeCursor: "2026-01-01T00:00:00.000Z|USER|msg-9",
        }),
      ),
    ).toBe("NOT_FOUND");
    expect(notebookServer.listOlderNotebookMessages).not.toHaveBeenCalled();
  });
});

describe("deleting a notebook", () => {
  it("ND1: deletes the notebook row and nothing else — the course it built survives", async () => {
    notebookServer.resolveNotebookInOrg.mockResolvedValueOnce({
      notebook: { id: "nb-1", organizationId: ORG_A, courseId: "course-1" },
      membership: { role: "admin" },
    });
    db.notebook.delete.mockResolvedValueOnce({ id: "nb-1" });

    await caller(OWNER).delete({ notebookId: "nb-1", orgSlug: ORG_SLUG });

    expect(db.notebook.delete).toHaveBeenCalledWith({ where: { id: "nb-1" } });
    expect(db.course.delete).not.toHaveBeenCalled();
    expect(db.course.deleteMany).not.toHaveBeenCalled();
    expect(db.course.update).not.toHaveBeenCalled();
  });

  it("ND1: deletes the notebook the boundary resolved, not the id as it arrived", async () => {
    notebookServer.resolveNotebookInOrg.mockResolvedValueOnce({
      notebook: { id: "nb-resolved", organizationId: ORG_A },
      membership: { role: "admin" },
    });
    db.notebook.delete.mockResolvedValueOnce({ id: "nb-resolved" });

    await caller(OWNER).delete({ notebookId: "nb-as-sent", orgSlug: ORG_SLUG });

    expect(db.notebook.delete).toHaveBeenCalledWith({
      where: { id: "nb-resolved" },
    });
  });

  it("ND2: refuses another user's notebook indistinguishably, and deletes nothing", async () => {
    notebookServer.resolveNotebookInOrg.mockRejectedValueOnce(
      notebookNotFound(),
    );

    expect(
      await refusalCode(() =>
        caller(OWNER).delete({
          notebookId: "nb-of-another-user",
          orgSlug: ORG_SLUG,
        }),
      ),
    ).toBe("NOT_FOUND");
    expect(db.notebook.delete).not.toHaveBeenCalled();
  });
});
