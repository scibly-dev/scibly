import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  course: { findUnique: vi.fn() },
  courseEnrollment: { findFirst: vi.fn() },
  scene: { findUnique: vi.fn() },
}));

const requireTenantContext = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => ({ requireTenantContext }));

const {
  requireCourseAdmin,
  requireCourseEnrollment,
  authorizeSceneEditorRoom,
} = await import("./policy");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireCourseAdmin", () => {
  it("CA1: refuses a course that does not exist with NOT_FOUND", async () => {
    db.course.findUnique.mockResolvedValueOnce(null);

    await expect(requireCourseAdmin("c1", "u1")).rejects.toMatchObject({
      code: "NOT_FOUND",
      applicationCode: "course.not_found",
    });
    expect(requireTenantContext).not.toHaveBeenCalled();
  });

  it("CA2: refuses when the caller is not admin/owner of the course's own organization", async () => {
    db.course.findUnique.mockResolvedValueOnce({
      id: "c1",
      organizationId: "orgA",
    });
    requireTenantContext.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(requireCourseAdmin("c1", "u1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(requireTenantContext).toHaveBeenCalledWith(
      "orgA",
      { userId: "u1" },
      "admin_or_owner",
    );
  });

  it("CA3: succeeds and returns the course for an admin/owner of the course's own organization", async () => {
    db.course.findUnique.mockResolvedValueOnce({
      id: "c1",
      organizationId: "orgA",
    });
    requireTenantContext.mockResolvedValueOnce({
      organizationId: "orgA",
      membershipId: "m1",
      role: "admin",
    });

    await expect(requireCourseAdmin("c1", "u1")).resolves.toMatchObject({
      id: "c1",
    });
    expect(requireTenantContext).toHaveBeenCalledWith(
      "orgA",
      { userId: "u1" },
      "admin_or_owner",
    );
  });
});

describe("requireCourseEnrollment", () => {
  it("CE1: bypasses the enrollment check entirely for an admin/owner role", async () => {
    await expect(
      requireCourseEnrollment("c1", "u1", "admin"),
    ).resolves.toBeNull();
    expect(db.courseEnrollment.findFirst).not.toHaveBeenCalled();
  });

  it("CE2: refuses a member with no enrollment row for this course, with FORBIDDEN", async () => {
    db.courseEnrollment.findFirst.mockResolvedValueOnce(null);

    await expect(
      requireCourseEnrollment("c1", "u1", "member"),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      applicationCode: "course.enrollment_required",
    });
  });

  it("CE3: succeeds for a member enrolled in this course", async () => {
    db.courseEnrollment.findFirst.mockResolvedValueOnce({ id: "e1" });

    await expect(
      requireCourseEnrollment("c1", "u1", "member"),
    ).resolves.toMatchObject({ id: "e1" });
  });
});

describe("authorizeSceneEditorRoom", () => {
  it("ER1: refuses a scene that does not exist with NOT_FOUND", async () => {
    db.scene.findUnique.mockResolvedValueOnce(null);

    await expect(
      authorizeSceneEditorRoom({ userId: "u1" }, "s1"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      applicationCode: "scene.not_found",
    });
  });

  it("ER2: refuses a caller who is not admin/owner of the scene's own organization", async () => {
    db.scene.findUnique.mockResolvedValueOnce({
      lesson: { course: { organizationId: "orgA" } },
    });
    requireTenantContext.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(
      authorizeSceneEditorRoom({ userId: "u1" }, "s1"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("ER3: succeeds for an admin/owner of the scene's own organization, checking that org specifically", async () => {
    db.scene.findUnique.mockResolvedValueOnce({
      lesson: { course: { organizationId: "orgA" } },
    });
    requireTenantContext.mockResolvedValueOnce({
      organizationId: "orgA",
      membershipId: "m1",
      role: "owner",
    });

    await expect(
      authorizeSceneEditorRoom({ userId: "u1" }, "s1"),
    ).resolves.toMatchObject({ access: "write" });
    expect(requireTenantContext).toHaveBeenCalledWith(
      "orgA",
      { userId: "u1" },
      "admin_or_owner",
    );
  });
});
