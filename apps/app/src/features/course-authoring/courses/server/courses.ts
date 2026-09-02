import type { Prisma } from "@scibly/db";
import type { CourseMode } from "@scibly/db/enums";

import { AppError } from "@scibly/api/application-error";
import { assertAllowed, decidePublicCourseCap } from "@scibly/api/entitlement";
import { db } from "@scibly/db";

import "server-only";
import {
  requireOrganizationBySlug,
  requireOrgMember,
} from "@/features/organizations/server";
import { lockNotebookCourseLink } from "@/lib/db/transaction-locks";

import {
  requireCourseAccess,
  requireCourseAdmin,
} from "../../access/server/policy";

async function requireLinkableNotebook(
  tx: Prisma.TransactionClient,
  notebookId: string,
  userId: string,
  organizationId: string,
  organizationMismatchMessage: string,
) {
  await lockNotebookCourseLink(tx, notebookId);
  const notebook = await tx.notebook.findUnique({
    where: { id: notebookId },
    select: { id: true, userId: true, organizationId: true, courseId: true },
  });
  if (!notebook) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Notebook not found.",
    });
  }
  if (notebook.userId !== userId) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "api.forbidden",
      message: "You do not have access to this notebook.",
    });
  }
  if (notebook.organizationId !== organizationId) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: organizationMismatchMessage,
    });
  }
  return notebook;
}

export async function getCourse(userId: string, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      organization: true,
      versions: {
        where: { superseded: false },
        orderBy: { version: "desc" },
        take: 1,
        select: { version: true, publishedAt: true },
      },
      _count: {
        select: {
          lessons: { where: { courseVersionId: null } },
          enrollments: true,
        },
      },
      lessons: {
        where: { courseVersionId: null },
        select: { estimatedTimeToCompleteMinutes: true },
      },
    },
  });
  if (!course) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Course not found.",
    });
  }

  await requireCourseAccess(userId, course);

  const { lessons, ...restCourse } = course;
  return {
    ...restCourse,
    totalEstimatedTimeMinutes: lessons.reduce(
      (total, lesson) => total + lesson.estimatedTimeToCompleteMinutes,
      0,
    ),
  };
}

export async function listCourses(
  userId: string,
  input: {
    orgSlug: string;
    limit: number;
    cursor?: number | null;
    search?: string;
  },
) {
  const organization = await requireOrganizationBySlug(input.orgSlug);
  await requireOrgMember(organization.id, userId, "admin_or_owner");

  const where: Prisma.CourseWhereInput = {
    organizationId: organization.id,
    OR: input.search
      ? [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          { category: { contains: input.search, mode: "insensitive" } },
        ]
      : undefined,
  };
  const offset = input.cursor ?? 0;
  const [totalCount, courses] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      include: {
        _count: {
          select: { lessons: { where: { courseVersionId: null } } },
        },
        lessons: {
          where: { courseVersionId: null },
          select: { estimatedTimeToCompleteMinutes: true },
        },
        versions: {
          where: { superseded: false },
          orderBy: { version: "desc" },
          take: 1,
          select: { version: true, publishedAt: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: input.limit + 1,
      skip: offset,
    }),
  ]);

  return {
    items: courses
      .slice(0, input.limit)
      .map(({ lessons, versions, ...course }) => ({
        ...course,
        totalEstimatedTimeMinutes: lessons.reduce(
          (total, lesson) => total + lesson.estimatedTimeToCompleteMinutes,
          0,
        ),
        latestPublishedVersion: versions[0] ?? null,
      })),
    nextCursor: courses.length > input.limit ? offset + input.limit : undefined,
    totalCount,
  };
}

export async function createCourse(
  userId: string,
  input: {
    orgSlug: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    notebookId?: string;
    mode?: CourseMode;
  },
) {
  const organization = await requireOrganizationBySlug(input.orgSlug);
  await requireOrgMember(organization.id, userId, "admin_or_owner");

  return db.$transaction(async (tx) => {
    const notebook = input.notebookId
      ? await requireLinkableNotebook(
          tx,
          input.notebookId,
          userId,
          organization.id,
          "Notebook and course must belong to the same organization.",
        )
      : null;
    const course = await tx.course.create({
      data: {
        organizationId: organization.id,
        title: input.title,
        description: input.description,
        category: input.category,
        tags: input.tags,
        mode: input.mode,
      },
    });
    if (notebook) {
      await tx.notebook.update({
        where: { id: notebook.id },
        data: { courseId: course.id },
      });
    }
    return course;
  });
}

export async function updateCourse(
  userId: string,
  input: {
    courseId: string;
    title?: string;
    description?: string | null;
    category?: string | null;
    tags?: string[];
    thumbnail?: string | null;
    passingScorePct?: number | null;
    maxTries?: number | null;
    allowAnonymous?: boolean;
    mode?: CourseMode;
  },
) {
  const course = await requireCourseAdmin(input.courseId, userId, {
    select: { id: true, organizationId: true },
  });
  const { courseId, ...data } = input;
  const update = () => db.course.update({ where: { id: courseId }, data });

  if (data.mode === "LESSON") {
    const draftLessons = await db.lesson.count({
      where: { courseId, courseVersionId: null },
    });
    if (draftLessons > 1) {
      throw new AppError({
        code: "CONFLICT",
        applicationCode: "course.lesson_mode_needs_one_lesson",
        message:
          "Delete the other lessons first, or keep this a course. A lesson holds one lesson.",
      });
    }
  }

  if (data.allowAnonymous !== true) return update();

  assertAllowed(
    await decidePublicCourseCap(db, course.organizationId, courseId),
  );
  return update();
}

export async function linkNotebook(
  userId: string,
  input: { courseId: string; notebookId: string },
) {
  const course = await requireCourseAdmin(input.courseId, userId, {
    select: { id: true, organizationId: true },
  });
  await db.$transaction(async (tx) => {
    const notebook = await requireLinkableNotebook(
      tx,
      input.notebookId,
      userId,
      course.organizationId,
      "Notebook and course belong to different organizations.",
    );
    if (notebook.courseId !== input.courseId) {
      await tx.notebook.update({
        where: { id: input.notebookId },
        data: { courseId: input.courseId },
      });
    }
  });
  return { success: true };
}

export async function deleteCourse(userId: string, courseId: string) {
  await requireCourseAdmin(courseId, userId);
  await db.course.delete({ where: { id: courseId } });
  return { success: true };
}
