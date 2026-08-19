import type { PrismaClient } from "@scibly/db";

import { beforeEach, describe, expect, it, vi } from "vitest";

// requireDraftLesson takes its db client as a parameter, so it's doubled directly rather than via the module mock.
const db = vi.hoisted(() => ({
  scene: { findUnique: vi.fn() },
}));

const toMemberRole = vi.hoisted(() => vi.fn((role: string) => role));
const requireOrgMember = vi.hoisted(() => vi.fn());
const requireCourseEnrollment = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db, toMemberRole }));
vi.mock("@/features/organizations/server", () => ({ requireOrgMember }));
vi.mock("../../access/server/policy", () => ({ requireCourseEnrollment }));

const {
  requireSceneContentAccess,
  requireDraftSceneContentAccess,
  requireDraftLesson,
} = await import("./scene-access");

beforeEach(() => {
  vi.clearAllMocks();
});

function draftScene() {
  return {
    courseVersionId: null,
    lesson: { courseId: "course1", course: { organizationId: "orgA" } },
  };
}

function publishedScene() {
  return {
    courseVersionId: "cv1",
    lesson: { courseId: "course1", course: { organizationId: "orgA" } },
  };
}

describe("requireSceneContentAccess", () => {
  it("SC1: refuses a scene that does not exist with NOT_FOUND", async () => {
    db.scene.findUnique.mockResolvedValueOnce(null);

    await expect(requireSceneContentAccess("s1", "u1")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("SC2: refuses a plain member from a draft scene, never consulting enrollment", async () => {
    db.scene.findUnique.mockResolvedValueOnce(draftScene());
    requireOrgMember.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(requireSceneContentAccess("s1", "u1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(requireOrgMember).toHaveBeenCalledWith(
      "orgA",
      "u1",
      "admin_or_owner",
    );
    expect(requireCourseEnrollment).not.toHaveBeenCalled();
  });

  it("SC3: allows an admin/owner to read a draft scene without an enrollment row", async () => {
    db.scene.findUnique.mockResolvedValueOnce(draftScene());
    requireOrgMember.mockResolvedValueOnce({ id: "m1", role: "admin" });

    await expect(requireSceneContentAccess("s1", "u1")).resolves.toMatchObject({
      courseVersionId: null,
    });
    expect(requireCourseEnrollment).not.toHaveBeenCalled();
  });

  it("SC4: refuses a member of a published scene's course who is not enrolled", async () => {
    db.scene.findUnique.mockResolvedValueOnce(publishedScene());
    requireOrgMember.mockResolvedValueOnce({ id: "m1", role: "member" });
    requireCourseEnrollment.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(requireSceneContentAccess("s1", "u1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(requireOrgMember).toHaveBeenCalledWith("orgA", "u1", "member");
    expect(requireCourseEnrollment).toHaveBeenCalledWith(
      "course1",
      "u1",
      "member",
    );
  });

  it("SC5: allows a member enrolled in the published scene's course", async () => {
    db.scene.findUnique.mockResolvedValueOnce(publishedScene());
    requireOrgMember.mockResolvedValueOnce({ id: "m1", role: "member" });
    requireCourseEnrollment.mockResolvedValueOnce({ id: "e1" });

    await expect(requireSceneContentAccess("s1", "u1")).resolves.toMatchObject({
      courseVersionId: "cv1",
    });
  });

  it("SC6: allows an admin/owner to read published scene content without an enrollment row", async () => {
    db.scene.findUnique.mockResolvedValueOnce(publishedScene());
    requireOrgMember.mockResolvedValueOnce({ id: "m1", role: "admin" });
    requireCourseEnrollment.mockResolvedValueOnce(null);

    await expect(requireSceneContentAccess("s1", "u1")).resolves.toMatchObject({
      courseVersionId: "cv1",
    });
    expect(requireCourseEnrollment).toHaveBeenCalledWith(
      "course1",
      "u1",
      "admin",
    );
  });
});

describe("requireDraftSceneContentAccess", () => {
  it("DC1: refuses a scene that has already been published, even for an admin/owner", async () => {
    db.scene.findUnique.mockResolvedValueOnce(publishedScene());
    requireOrgMember.mockResolvedValueOnce({ id: "m1", role: "admin" });
    requireCourseEnrollment.mockResolvedValueOnce(null);

    await expect(
      requireDraftSceneContentAccess("s1", "u1"),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot edit a published scene.",
    });
  });

  it("DC2: succeeds for a genuine draft scene", async () => {
    db.scene.findUnique.mockResolvedValueOnce(draftScene());
    requireOrgMember.mockResolvedValueOnce({ id: "m1", role: "admin" });

    await expect(
      requireDraftSceneContentAccess("s1", "u1"),
    ).resolves.toMatchObject({ courseVersionId: null });
  });
});

describe("requireDraftLesson", () => {
  function mockClient() {
    return { lesson: { findUnique: vi.fn() } };
  }

  it("DL1: refuses a lesson that does not exist with NOT_FOUND", async () => {
    const client = mockClient();
    client.lesson.findUnique.mockResolvedValueOnce(null);

    await expect(
      requireDraftLesson(client as unknown as PrismaClient, "l1", "u1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("DL2: refuses a lesson that has already been published, without consulting roles", async () => {
    const client = mockClient();
    client.lesson.findUnique.mockResolvedValueOnce({
      courseVersionId: "cv1",
      course: { organizationId: "orgA" },
    });

    await expect(
      requireDraftLesson(client as unknown as PrismaClient, "l1", "u1"),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot edit a published lesson.",
    });
    expect(requireOrgMember).not.toHaveBeenCalled();
  });

  it("DL3: refuses a plain member from editing a draft lesson", async () => {
    const client = mockClient();
    client.lesson.findUnique.mockResolvedValueOnce({
      courseVersionId: null,
      course: { organizationId: "orgA" },
    });
    requireOrgMember.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(
      requireDraftLesson(client as unknown as PrismaClient, "l1", "u1"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("DL4: succeeds for an admin/owner of the draft lesson's own organization", async () => {
    const client = mockClient();
    client.lesson.findUnique.mockResolvedValueOnce({
      courseVersionId: null,
      course: { organizationId: "orgA" },
    });
    requireOrgMember.mockResolvedValueOnce({ id: "m1", role: "admin" });

    await expect(
      requireDraftLesson(client as unknown as PrismaClient, "l1", "u1"),
    ).resolves.toMatchObject({ courseVersionId: null });
    expect(requireOrgMember).toHaveBeenCalledWith(
      "orgA",
      "u1",
      "admin_or_owner",
    );
  });
});
