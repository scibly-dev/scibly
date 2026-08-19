import { assertAllowed, decideCoursePublishing } from "@scibly/api/entitlement";
import { db } from "@scibly/db";

import "server-only";

import { requireCourseAdmin } from "../../access/server/policy";
import { publishCourseSnapshot } from "./publish-course-snapshot";

export async function publishCourse(
  userId: string,
  input: {
    courseId: string;
    supersedePrevious: boolean;
    force?: boolean;
  },
) {
  const course = await requireCourseAdmin(input.courseId, userId, {
    select: { id: true, organizationId: true, updatedAt: true },
  });

  assertAllowed(await decideCoursePublishing(db, course.organizationId));
  const version = await db.$transaction((tx) =>
    publishCourseSnapshot(tx, course, userId, {
      supersedePrevious: input.supersedePrevious,
      force: input.force,
    }),
  );
  return { success: true, version: version.version };
}
