import type { MemberRole, Prisma } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { db, toMemberRole } from "@scibly/db";

import {
  type ActorContext,
  requireOrgMember,
  requireTenantContext,
} from "@/features/organizations/server";

type CourseSelect = Prisma.CourseSelect;

export async function requireCourseEnrollment(
  courseId: string,
  userId: string,
  userRole: MemberRole,
) {
  if (userRole === "admin" || userRole === "owner") return null;

  const enrollment = await db.courseEnrollment.findFirst({
    where: { courseId, userId },
  });
  if (!enrollment) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "course.enrollment_required",
      message: "You must be enrolled to access this course.",
    });
  }
  return enrollment;
}

// Takes the course object rather than an id so callers that already fetched it avoid a second read.
export async function requireCourseAccess(
  userId: string,
  course: { id: string; organizationId: string },
) {
  const membership = await requireOrgMember(
    course.organizationId,
    userId,
    "member",
  );
  await requireCourseEnrollment(
    course.id,
    userId,
    toMemberRole(membership.role),
  );
}

export async function requireCourseAdmin(
  courseId: string,
  userId: string,
  opts?: { select?: CourseSelect },
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: opts?.select ?? { id: true, organizationId: true },
  });
  if (!course) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "course.not_found",
      message: "Course not found.",
    });
  }

  await requireTenantContext(
    course.organizationId,
    { userId },
    "admin_or_owner",
  );
  return course;
}

export async function authorizeCourseMetadataRoom(
  actor: ActorContext,
  courseId: string,
) {
  const course = await requireCourseAdmin(courseId, actor.userId, {
    select: { id: true, organizationId: true },
  });
  return {
    access: "write" as const,
    tenant: { organizationId: course.organizationId },
  };
}

export async function authorizeSceneEditorRoom(
  actor: ActorContext,
  sceneId: string,
) {
  const scene = await db.scene.findUnique({
    where: { id: sceneId },
    select: {
      lesson: { select: { course: { select: { organizationId: true } } } },
    },
  });
  if (!scene) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "scene.not_found",
      message: "Scene not found.",
    });
  }

  const tenant = await requireTenantContext(
    scene.lesson.course.organizationId,
    actor,
    "admin_or_owner",
  );
  return { access: "write" as const, tenant };
}
