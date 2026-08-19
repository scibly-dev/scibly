import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";

import {
  getLearnerDashboardStats,
  listEnrolledCourses,
} from "../server/dashboard";
import { getDashboardStatsSchema, listEnrolledCoursesSchema } from "./schemas";

export const learningDashboardRouter = createTRPCRouter({
  listEnrolledCourses: protectedProcedure
    .input(listEnrolledCoursesSchema)
    .query(({ input, ctx }) => listEnrolledCourses(ctx.session.user.id, input)),

  getDashboardStats: protectedProcedure
    .input(getDashboardStatsSchema)
    .query(({ input, ctx }) =>
      getLearnerDashboardStats(ctx.session.user.id, input.orgSlug),
    ),
});
