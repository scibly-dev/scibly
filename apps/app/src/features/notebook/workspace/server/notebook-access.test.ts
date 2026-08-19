import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  notebook: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const orgPolicy = vi.hoisted(() => ({
  resolveOrg: vi.fn(),
  requireOrgMember: vi.fn(),
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => orgPolicy);

const { assertNotebookOwner, resolveNotebook, resolveNotebookInOrg } =
  await import("./access");
const { ensureNotebook, UNTITLED_NOTEBOOK } = await import("./ensure-notebook");
const { getNotebookMetaInOrg } = await import("./notebook-details");

const OWNER = "user-owner";
const COLLEAGUE = "user-colleague";
const ORG_A = "org-a";
const ORG_B = "org-b";

const NOTEBOOK_NOT_FOUND = {
  code: "NOT_FOUND",
  applicationCode: "api.not_found",
  message: "Notebook not found.",
};

const NOTEBOOK_ROW = {
  id: "nb-1",
  title: UNTITLED_NOTEBOOK,
  userId: OWNER,
  organizationId: ORG_A,
};

function notebookRow(overrides: Partial<typeof NOTEBOOK_ROW> = {}) {
  return { ...NOTEBOOK_ROW, ...overrides };
}

function membershipIn(organizationId: string, role: string, userId = OWNER) {
  return { id: "mem-1", organizationId, userId, role };
}

function grantOrg(organizationId: string, role = "admin", userId = OWNER) {
  orgPolicy.resolveOrg.mockResolvedValue({
    organization: { id: organizationId },
    membership: membershipIn(organizationId, role, userId),
  });
}

function orgRefusal(applicationCode: string) {
  return new AppError({
    code: "FORBIDDEN",
    applicationCode,
    message: "You do not have access to this organization.",
  });
}

function observed(error: AppError) {
  return {
    code: error.code,
    applicationCode: error.applicationCode,
    message: error.message,
  };
}

function syncRefusal(call: () => void) {
  try {
    call();
  } catch (error) {
    if (error instanceof AppError) return observed(error);
    throw error;
  }
  throw new Error("expected the check to refuse, but it passed");
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) return observed(error);
    throw error;
  }
  throw new Error("expected the call to be refused, but it resolved");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolving a notebook without an organization in the request", () => {
  it("refuses a colleague's notebook even though they share the organization", async () => {
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());

    expect(await refusal(() => resolveNotebook("nb-1", COLLEAGUE))).toEqual(
      NOTEBOOK_NOT_FOUND,
    );
    expect(orgPolicy.requireOrgMember).not.toHaveBeenCalled();
  });

  it("checks membership of the notebook's own organization, at the authoring bar", async () => {
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());
    orgPolicy.requireOrgMember.mockResolvedValueOnce(
      membershipIn(ORG_A, "admin"),
    );

    await resolveNotebook("nb-1", OWNER);

    expect(orgPolicy.requireOrgMember).toHaveBeenCalledWith(
      ORG_A,
      OWNER,
      "admin_or_owner",
    );
  });

  it("refuses the owner when they are only a plain member of the organization", async () => {
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());
    orgPolicy.requireOrgMember.mockRejectedValueOnce(
      orgRefusal("organization.admin_required"),
    );

    expect(await refusal(() => resolveNotebook("nb-1", OWNER))).toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "organization.admin_required",
    });
  });

  it("refuses an owner whose membership in the organization has been removed", async () => {
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());
    orgPolicy.requireOrgMember.mockRejectedValueOnce(
      orgRefusal("organization.access_denied"),
    );

    expect(await refusal(() => resolveNotebook("nb-1", OWNER))).toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "organization.access_denied",
    });
  });

  it("resolves for the owner who still holds an authoring role", async () => {
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());
    orgPolicy.requireOrgMember.mockResolvedValueOnce(
      membershipIn(ORG_A, "owner"),
    );

    await expect(resolveNotebook("nb-1", OWNER)).resolves.toMatchObject({
      notebook: { id: "nb-1" },
      membership: { role: "owner" },
    });
  });
});

describe("resolving a notebook through the organization in the URL", () => {
  it("refuses the owner following a deep link that names a different organization", async () => {
    grantOrg(ORG_B);
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());

    expect(
      await refusal(() => resolveNotebookInOrg("nb-1", OWNER, "org-b-slug")),
    ).toEqual(NOTEBOOK_NOT_FOUND);
  });

  it("refuses a colleague who owns the organization the notebook lives in", async () => {
    grantOrg(ORG_A, "owner", COLLEAGUE);
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());

    expect(
      await refusal(() =>
        resolveNotebookInOrg("nb-1", COLLEAGUE, "org-a-slug"),
      ),
    ).toEqual(NOTEBOOK_NOT_FOUND);
  });

  it("resolves the organization named by the caller before the notebook is loaded", async () => {
    orgPolicy.resolveOrg.mockRejectedValueOnce(
      orgRefusal("organization.access_denied"),
    );

    await refusal(() => resolveNotebookInOrg("nb-1", OWNER, "org-a-slug"));

    expect(orgPolicy.resolveOrg).toHaveBeenCalledWith("org-a-slug", OWNER);
    expect(db.notebook.findUnique).not.toHaveBeenCalled();
  });

  it("refuses when the caller is not an admin/owner of the URL organization", async () => {
    orgPolicy.resolveOrg.mockRejectedValueOnce(
      orgRefusal("organization.admin_required"),
    );

    expect(
      await refusal(() => resolveNotebookInOrg("nb-1", OWNER, "org-a-slug")),
    ).toMatchObject({ applicationCode: "organization.admin_required" });
  });

  it("resolves for the owner inside the notebook's own organization", async () => {
    grantOrg(ORG_A);
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());

    await expect(
      resolveNotebookInOrg("nb-1", OWNER, "org-a-slug"),
    ).resolves.toMatchObject({ notebook: { id: "nb-1" } });
  });
});

describe("what a refusal tells the caller", () => {
  const cases = [
    { case: "a notebook that does not exist", row: null, userId: OWNER },
    {
      case: "a notebook belonging to another user",
      row: notebookRow({ userId: COLLEAGUE }),
      userId: OWNER,
    },
    {
      case: "a notebook belonging to another organization",
      row: notebookRow({ organizationId: ORG_B }),
      userId: OWNER,
    },
  ];

  it.each(cases)(
    "refusing $case is indistinguishable from any other refusal",
    async ({ row, userId }) => {
      grantOrg(ORG_A);
      db.notebook.findUnique.mockResolvedValueOnce(row);

      expect(
        await refusal(() => resolveNotebookInOrg("nb-1", userId, "org-a-slug")),
      ).toEqual(NOTEBOOK_NOT_FOUND);
    },
  );

  it.each(cases)(
    "reading a notebook's metadata leaks no more than resolving it does, for $case",
    async ({ row, userId }) => {
      grantOrg(ORG_A);
      db.notebook.findUnique.mockResolvedValueOnce(row);

      expect(
        await refusal(() => getNotebookMetaInOrg("nb-1", userId, "org-a-slug")),
      ).toEqual(NOTEBOOK_NOT_FOUND);
    },
  );
});

describe("the two-key check itself", () => {
  it("refuses a notebook owned by someone else, whatever organization is named", () => {
    expect(
      syncRefusal(() =>
        assertNotebookOwner(
          { userId: COLLEAGUE, organizationId: ORG_A },
          OWNER,
          ORG_A,
        ),
      ),
    ).toEqual(NOTEBOOK_NOT_FOUND);
  });

  it("refuses a notebook belonging to another organization, whoever owns it", () => {
    expect(
      syncRefusal(() =>
        assertNotebookOwner(
          { userId: OWNER, organizationId: ORG_A },
          OWNER,
          ORG_B,
        ),
      ),
    ).toEqual(NOTEBOOK_NOT_FOUND);
  });

  it("an empty organization is a mismatch, never a reason to skip the check", () => {
    expect(
      syncRefusal(() =>
        assertNotebookOwner(
          { userId: OWNER, organizationId: ORG_A },
          OWNER,
          "",
        ),
      ),
    ).toEqual(NOTEBOOK_NOT_FOUND);
  });

  it("accepts only when both keys match", () => {
    expect(() =>
      assertNotebookOwner(
        { userId: OWNER, organizationId: ORG_A },
        OWNER,
        ORG_A,
      ),
    ).not.toThrow();
  });
});

describe("ensuring a notebook exists", () => {
  it("creates one owned by the caller in the organization named in the URL when none is given", async () => {
    grantOrg(ORG_A);
    db.notebook.create.mockResolvedValueOnce({ id: "nb-new" });

    await expect(
      ensureNotebook({ userId: OWNER, orgSlug: "org-a-slug" }),
    ).resolves.toEqual({ notebookId: "nb-new", organizationId: ORG_A });
    expect(db.notebook.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: OWNER, organizationId: ORG_A }),
    });
  });

  it("never lets the caller choose the new notebook's id", async () => {
    grantOrg(ORG_A);
    db.notebook.create.mockResolvedValueOnce({ id: "nb-new" });

    await ensureNotebook({ userId: OWNER, orgSlug: "org-a-slug" });

    expect(db.notebook.create.mock.calls[0]?.[0].data).not.toHaveProperty("id");
  });

  it("titles a newly created notebook with the placeholder when none is given", async () => {
    grantOrg(ORG_A);
    db.notebook.create.mockResolvedValueOnce({ id: "nb-new" });

    await ensureNotebook({ userId: OWNER, orgSlug: "org-a-slug" });

    expect(db.notebook.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ title: UNTITLED_NOTEBOOK }),
    });
  });

  it("neither resolves nor creates anything for another user's notebook", async () => {
    grantOrg(ORG_A);
    db.notebook.findUnique.mockResolvedValueOnce(
      notebookRow({ userId: COLLEAGUE }),
    );

    expect(
      await refusal(() =>
        ensureNotebook({
          notebookId: "nb-1",
          userId: OWNER,
          orgSlug: "org-a-slug",
        }),
      ),
    ).toEqual(NOTEBOOK_NOT_FOUND);
    expect(db.notebook.create).not.toHaveBeenCalled();
  });

  it("never adopts a notebook from another organization into the one in the URL", async () => {
    grantOrg(ORG_A);
    db.notebook.findUnique.mockResolvedValueOnce(
      notebookRow({ organizationId: ORG_B }),
    );

    expect(
      await refusal(() =>
        ensureNotebook({
          notebookId: "nb-1",
          userId: OWNER,
          orgSlug: "org-a-slug",
        }),
      ),
    ).toEqual(NOTEBOOK_NOT_FOUND);
    expect(db.notebook.create).not.toHaveBeenCalled();
  });

  it("a notebook that does not exist is refused rather than created under the id the caller sent", async () => {
    grantOrg(ORG_A);
    db.notebook.findUnique.mockResolvedValueOnce(null);

    expect(
      await refusal(() =>
        ensureNotebook({
          notebookId: "nb-chosen-by-caller",
          userId: OWNER,
          orgSlug: "org-a-slug",
        }),
      ),
    ).toEqual(NOTEBOOK_NOT_FOUND);
    expect(db.notebook.create).not.toHaveBeenCalled();
  });

  it("promotes the placeholder title when a title arrives with an existing notebook", async () => {
    grantOrg(ORG_A);
    db.notebook.findUnique.mockResolvedValueOnce(notebookRow());
    db.notebook.update.mockResolvedValueOnce(
      notebookRow({ title: "Genetics" }),
    );

    await ensureNotebook({
      notebookId: "nb-1",
      userId: OWNER,
      orgSlug: "org-a-slug",
      title: "Genetics",
    });

    expect(db.notebook.update).toHaveBeenCalledWith({
      where: { id: "nb-1" },
      data: { title: "Genetics" },
    });
  });

  it("never renames a notebook that already has a title of its own", async () => {
    grantOrg(ORG_A);
    db.notebook.findUnique.mockResolvedValueOnce(
      notebookRow({ title: "Mitochondria, week 3" }),
    );

    await ensureNotebook({
      notebookId: "nb-1",
      userId: OWNER,
      orgSlug: "org-a-slug",
      title: "Genetics",
    });

    expect(db.notebook.update).not.toHaveBeenCalled();
  });
});
