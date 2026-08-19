import type * as DbModule from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  notebookSource: { findUnique: vi.fn() },
  notebook: { findUnique: vi.fn() },
}));

const orgPolicy = vi.hoisted(() => ({
  resolveOrg: vi.fn(),
  requireOrgMember: vi.fn(),
}));

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db,
}));
vi.mock("@/features/organizations/server", () => orgPolicy);

const { resolveOwnedNotebookSource } = await import("./sources");

const OWNER = "user-owner";
const STRANGER = "user-stranger";

const SOURCE_NOT_FOUND = {
  code: "NOT_FOUND",
  applicationCode: "api.not_found",
  message: "Source not found.",
};

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) {
      return {
        code: error.code,
        applicationCode: error.applicationCode,
        message: error.message,
      };
    }
    throw error;
  }
  throw new Error("expected the call to be refused, but it resolved");
}

beforeEach(() => {
  vi.clearAllMocks();
  orgPolicy.requireOrgMember.mockResolvedValue({
    id: "mem-1",
    organizationId: "org-a",
    userId: OWNER,
    role: "admin",
  });
});

describe("reaching a source by its id", () => {
  it("NC1: refuses a source hanging off another user's notebook", async () => {
    db.notebookSource.findUnique.mockResolvedValueOnce({
      id: "src-1",
      notebookId: "nb-1",
      url: "notebook-sources/org-a/nb-1/src-1/report.pdf",
    });
    db.notebook.findUnique.mockResolvedValueOnce({
      id: "nb-1",
      userId: OWNER,
      organizationId: "org-a",
    });

    expect(
      await refusal(() => resolveOwnedNotebookSource("src-1", STRANGER)),
    ).toEqual(SOURCE_NOT_FOUND);
  });

  it("NC1: re-derives the notebook from the source rather than trusting the id it was handed", async () => {
    db.notebookSource.findUnique.mockResolvedValueOnce({
      id: "src-1",
      notebookId: "nb-owning",
    });
    db.notebook.findUnique.mockResolvedValueOnce({
      id: "nb-owning",
      userId: OWNER,
      organizationId: "org-a",
    });

    const { source, notebook } = await resolveOwnedNotebookSource(
      "src-1",
      OWNER,
    );

    expect(db.notebook.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "nb-owning" } }),
    );
    expect(source.id).toBe("src-1");
    expect(notebook.id).toBe("nb-owning");
  });

  it("NC1: refuses a source whose notebook has left the caller's organization", async () => {
    db.notebookSource.findUnique.mockResolvedValueOnce({
      id: "src-1",
      notebookId: "nb-1",
    });
    db.notebook.findUnique.mockResolvedValueOnce({
      id: "nb-1",
      userId: OWNER,
      organizationId: "org-a",
    });
    orgPolicy.requireOrgMember.mockRejectedValueOnce(
      new AppError({
        code: "FORBIDDEN",
        applicationCode: "organization.access_denied",
        message: "You do not have access to this organization.",
      }),
    );

    expect(
      await refusal(() => resolveOwnedNotebookSource("src-1", OWNER)),
    ).toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("what a refused source tells the caller", () => {
  it("NC5: a source that does not exist and a stranger's source are refused identically", async () => {
    db.notebookSource.findUnique.mockResolvedValueOnce(null);
    const absent = await refusal(() =>
      resolveOwnedNotebookSource("src-absent", OWNER),
    );

    db.notebookSource.findUnique.mockResolvedValueOnce({
      id: "src-1",
      notebookId: "nb-1",
    });
    db.notebook.findUnique.mockResolvedValueOnce({
      id: "nb-1",
      userId: STRANGER,
      organizationId: "org-a",
    });
    const someoneElses = await refusal(() =>
      resolveOwnedNotebookSource("src-1", OWNER),
    );

    expect(absent).toEqual(SOURCE_NOT_FOUND);
    expect(someoneElses).toEqual(absent);
  });

  it("NC5: a source id belonging to a notebook that no longer exists says nothing about the notebook", async () => {
    db.notebookSource.findUnique.mockResolvedValueOnce({
      id: "src-1",
      notebookId: "nb-deleted",
    });
    db.notebook.findUnique.mockResolvedValueOnce(null);

    expect(
      await refusal(() => resolveOwnedNotebookSource("src-1", OWNER)),
    ).toEqual(SOURCE_NOT_FOUND);
  });

  it("NC5: an organization-level refusal is passed through, not disguised as a missing source", async () => {
    db.notebookSource.findUnique.mockResolvedValueOnce({
      id: "src-1",
      notebookId: "nb-1",
    });
    db.notebook.findUnique.mockResolvedValueOnce({
      id: "nb-1",
      userId: OWNER,
      organizationId: "org-a",
    });
    orgPolicy.requireOrgMember.mockRejectedValueOnce(
      new AppError({
        code: "FORBIDDEN",
        applicationCode: "organization.admin_required",
        message: "You must be an admin or owner to perform this action.",
      }),
    );

    expect(
      await refusal(() => resolveOwnedNotebookSource("src-1", OWNER)),
    ).toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "organization.admin_required",
    });
  });

  it("NC5: a database failure is never swallowed into a missing source", async () => {
    db.notebookSource.findUnique.mockResolvedValueOnce({
      id: "src-1",
      notebookId: "nb-1",
    });
    db.notebook.findUnique.mockRejectedValueOnce(
      new Error("connection terminated"),
    );

    await expect(resolveOwnedNotebookSource("src-1", OWNER)).rejects.toThrow(
      "connection terminated",
    );
  });
});
