import { type Prisma } from "@scibly/db/client";

import { type Decision } from "../decision";
import { resolveSubscribedPlan } from "../policy";

export const decidePublicCourseCap = async (
  db: Prisma.TransactionClient,
  organizationId: string,

  courseId: string,
): Promise<Decision> => {
  const { plan } = await resolveSubscribedPlan(db, organizationId);
  const limit = plan.publicCourses;
  const used = await db.course.count({
    where: { organizationId, allowAnonymous: true, id: { not: courseId } },
  });
  const remaining = Math.max(0, limit - used);

  if (remaining < 1) {
    return {
      refusal: {
        applicationCode: "entitlement.public_courses_exhausted",

        message: `This organization already has its plan's ${limit} public courses in use. Turn the public link off for another course to free one — enrolled learners are unaffected.`,
        details: { shortfall: 1, remainingPublicCourses: remaining },
      },
    };
  }

  return { refusal: null };
};
