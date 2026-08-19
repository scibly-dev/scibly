import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  member: { findMany: vi.fn() },
  courseVersion: { findFirst: vi.fn() },
  courseEnrollment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },

  organizationSubscription: { findUnique: vi.fn() },
  $queryRaw: vi.fn(),
}));

const requireCourseAdmin = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("../../access/server/policy", () => ({ requireCourseAdmin }));
vi.mock("../../analytics/server/list-enrollments", () => ({
  listEnrollmentsHelper: vi.fn(),
}));

const { enrollCourseMembers, removeCourseEnrollment, listAvailableMembers } =
  await import("./enrollments");

beforeEach(() => {
  vi.clearAllMocks();
  requireCourseAdmin.mockResolvedValue({
    id: "c1",
    organizationId: "orgA",
    maxTries: 3,
  });
});

describe("enrollCourseMembers", () => {
  beforeEach(() => {
    db.courseVersion.findFirst.mockResolvedValue({ id: "v2", version: 2 });
    db.member.findMany.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);
    db.courseEnrollment.findMany.mockResolvedValue([]);
    db.courseEnrollment.createMany.mockResolvedValue({ count: 2 });
    db.$queryRaw.mockResolvedValue([{ count: 0 }]);

    db.organizationSubscription.findUnique.mockResolvedValue({
      plan: "INTERNAL",
      purchasedLearnerSeats: 0,
      status: "ACTIVE",
    });
  });

  it("EM1: authorizes the caller as admin_or_owner before doing anything else", async () => {
    await enrollCourseMembers("admin", {
      courseId: "c1",
      userIds: ["u1", "u2"],
    });

    expect(requireCourseAdmin).toHaveBeenCalledWith("c1", "admin");
  });

  it("EM1: propagates FORBIDDEN from requireCourseAdmin without touching the database", async () => {
    requireCourseAdmin.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(
      enrollCourseMembers("admin", { courseId: "c1", userIds: ["u1"] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.courseVersion.findFirst).not.toHaveBeenCalled();
  });

  it("EM2: refuses with BAD_REQUEST when the course has no published version", async () => {
    db.courseVersion.findFirst.mockResolvedValueOnce(null);

    await expect(
      enrollCourseMembers("admin", { courseId: "c1", userIds: ["u1"] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.member.findMany).not.toHaveBeenCalled();
  });

  it("EM3: refuses with BAD_REQUEST when none of the given user ids are valid organization members", async () => {
    db.member.findMany.mockResolvedValueOnce([]);

    await expect(
      enrollCourseMembers("admin", { courseId: "c1", userIds: ["ghost"] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.courseEnrollment.createMany).not.toHaveBeenCalled();
  });

  it("EM4: silently excludes user ids that aren't valid organization members, enrolling the rest", async () => {
    db.member.findMany.mockResolvedValueOnce([{ userId: "u1" }]);

    await enrollCourseMembers("admin", {
      courseId: "c1",
      userIds: ["u1", "ghost"],
    });

    expect(db.courseEnrollment.createMany).toHaveBeenCalledWith({
      data: [
        {
          courseId: "c1",
          organizationId: "orgA",
          userId: "u1",
          courseVersionId: "v2",
          dueDate: null,
        },
      ],
    });
  });

  it("EM5: skips user ids already enrolled in the latest version, returning count 0 when all are already enrolled", async () => {
    db.courseEnrollment.findMany.mockResolvedValueOnce([
      { userId: "u1" },
      { userId: "u2" },
    ]);

    await expect(
      enrollCourseMembers("admin", { courseId: "c1", userIds: ["u1", "u2"] }),
    ).resolves.toEqual({ count: 0 });
    expect(db.courseEnrollment.createMany).not.toHaveBeenCalled();
  });

  it("EM6: on success, creates one enrollment per newly-enrolled user against the latest version with the given dueDate", async () => {
    const dueDate = new Date("2026-08-01");

    await expect(
      enrollCourseMembers("admin", {
        courseId: "c1",
        userIds: ["u1", "u2"],
        dueDate,
      }),
    ).resolves.toEqual({ count: 2 });

    expect(db.courseEnrollment.createMany).toHaveBeenCalledWith({
      data: [
        {
          courseId: "c1",
          organizationId: "orgA",
          userId: "u1",
          courseVersionId: "v2",
          dueDate,
        },
        {
          courseId: "c1",
          organizationId: "orgA",
          userId: "u2",
          courseVersionId: "v2",
          dueDate,
        },
      ],
    });
  });

  it("EW1: a batch past the remaining seats is refused after dedup, before anything is written", async () => {
    db.organizationSubscription.findUnique.mockResolvedValue({
      plan: "STARTER",
      purchasedLearnerSeats: 0,
      status: "ACTIVE",
    });

    db.$queryRaw.mockResolvedValue([{ count: 50 }]);

    await expect(
      enrollCourseMembers("admin", { courseId: "c1", userIds: ["u1", "u2"] }),
    ).rejects.toMatchObject({
      code: "PAYMENT_REQUIRED",
      applicationCode: "entitlement.seats_exhausted",
      details: { shortfall: 2, remainingSeats: 0 },
    });
    expect(db.courseEnrollment.createMany).not.toHaveBeenCalled();
  });

  it("EG1: a canceled subscription is refused before the seat count is even read", async () => {
    db.organizationSubscription.findUnique.mockResolvedValue({
      plan: "STARTER",
      purchasedLearnerSeats: 0,
      status: "CANCELED",
    });

    await expect(
      enrollCourseMembers("admin", { courseId: "c1", userIds: ["u1", "u2"] }),
    ).rejects.toMatchObject({
      code: "PAYMENT_REQUIRED",
      applicationCode: "entitlement.enroll_requires_subscription",
    });
    expect(db.courseEnrollment.createMany).not.toHaveBeenCalled();

    expect(db.courseEnrollment.findMany).toHaveBeenCalledTimes(1);
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it("EG3: a request that would enroll nobody new is not a billing refusal", async () => {
    db.organizationSubscription.findUnique.mockResolvedValue({
      plan: "STARTER",
      purchasedLearnerSeats: 0,
      status: "CANCELED",
    });
    db.courseEnrollment.findMany.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ]);

    await expect(
      enrollCourseMembers("admin", { courseId: "c1", userIds: ["u1", "u2"] }),
    ).resolves.toEqual({ count: 0 });
    expect(db.organizationSubscription.findUnique).not.toHaveBeenCalled();
  });

  it("FG4: a past-due organization still enrolls", async () => {
    db.organizationSubscription.findUnique.mockResolvedValue({
      plan: "STARTER",
      purchasedLearnerSeats: 0,
      status: "PAST_DUE",
    });

    await expect(
      enrollCourseMembers("admin", { courseId: "c1", userIds: ["u1", "u2"] }),
    ).resolves.toEqual({ count: 2 });
  });
});

describe("removeCourseEnrollment", () => {
  it("RM1: authorizes the caller as admin_or_owner before touching any enrollment", async () => {
    db.courseEnrollment.findFirst.mockResolvedValue(null);

    await removeCourseEnrollment("admin", { courseId: "c1", userId: "u1" });

    expect(requireCourseAdmin).toHaveBeenCalledWith("c1", "admin");
  });

  it("RM1: propagates FORBIDDEN from requireCourseAdmin without querying enrollments", async () => {
    requireCourseAdmin.mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { code: "FORBIDDEN" }),
    );

    await expect(
      removeCourseEnrollment("admin", { courseId: "c1", userId: "u1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.courseEnrollment.findFirst).not.toHaveBeenCalled();
  });

  it("RM2: orphans the matching enrollment by nulling userId rather than deleting it", async () => {
    db.courseEnrollment.findFirst.mockResolvedValue({ id: "e1" });

    await expect(
      removeCourseEnrollment("admin", { courseId: "c1", userId: "u1" }),
    ).resolves.toEqual({ success: true });
    expect(db.courseEnrollment.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { userId: null },
    });
  });

  it("RM3: is a no-op returning success when no enrollment matches", async () => {
    db.courseEnrollment.findFirst.mockResolvedValue(null);

    await expect(
      removeCourseEnrollment("admin", { courseId: "c1", userId: "u1" }),
    ).resolves.toEqual({ success: true });
    expect(db.courseEnrollment.update).not.toHaveBeenCalled();
  });
});

describe("listAvailableMembers", () => {
  const makeMember = (userId: string) => ({
    userId,
    user: {
      name: `Name ${userId}`,
      email: `${userId}@example.com`,
      image: null,
    },
  });

  beforeEach(() => {
    db.member.findMany.mockResolvedValue([makeMember("u1"), makeMember("u2")]);
  });

  it("AM1: excludes members who already have a courseEnrollment linked to this course", async () => {
    await listAvailableMembers("admin", { courseId: "c1" });

    expect(db.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: expect.objectContaining({
            courseEnrollments: { none: { courseId: "c1" } },
          }),
        }),
      }),
    );
  });

  it("AM2: filters by case-insensitive search over member name or email", async () => {
    await listAvailableMembers("admin", { courseId: "c1", search: "ann" });

    expect(db.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: expect.objectContaining({
            OR: [
              { name: { contains: "ann", mode: "insensitive" } },
              { email: { contains: "ann", mode: "insensitive" } },
            ],
          }),
        }),
      }),
    );
  });

  it("AM3: returns nextCursor only when more results exist beyond the current page", async () => {
    db.member.findMany.mockResolvedValueOnce([
      makeMember("u1"),
      makeMember("u2"),
      makeMember("u3"),
    ]);

    await expect(
      listAvailableMembers("admin", { courseId: "c1", limit: 2, cursor: 0 }),
    ).resolves.toEqual({
      items: [
        { id: "u1", name: "Name u1", email: "u1@example.com", image: null },
        { id: "u2", name: "Name u2", email: "u2@example.com", image: null },
      ],
      nextCursor: 2,
    });
  });

  it("AM3: omits nextCursor when the page isn't full", async () => {
    await expect(
      listAvailableMembers("admin", { courseId: "c1", limit: 10 }),
    ).resolves.toEqual({
      items: [
        { id: "u1", name: "Name u1", email: "u1@example.com", image: null },
        { id: "u2", name: "Name u2", email: "u2@example.com", image: null },
      ],
      nextCursor: undefined,
    });
  });
});
