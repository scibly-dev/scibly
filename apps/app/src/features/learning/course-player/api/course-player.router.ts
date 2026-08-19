import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";

import {
  confirmRetryAttempt,
  confirmVersionUpdate,
  getLearnerCourse,
  getLearnerSceneContent,
  openLearningSession,
} from "../server/learning-session";
import { getLearnerCourseSchema, getLearnerSceneContentSchema } from "./schema";

export const coursePlayerRouter = createTRPCRouter({
  openLearningSession: protectedProcedure
    .input(getLearnerCourseSchema)
    .mutation(({ input, ctx }) =>
      openLearningSession(ctx.session.user.id, input.courseId),
    ),

  confirmRetryAttempt: protectedProcedure
    .input(getLearnerCourseSchema)
    .mutation(({ input, ctx }) =>
      confirmRetryAttempt(ctx.session.user.id, input.courseId),
    ),

  confirmVersionUpdate: protectedProcedure
    .input(getLearnerCourseSchema)
    .mutation(({ input, ctx }) =>
      confirmVersionUpdate(ctx.session.user.id, input.courseId),
    ),

  getLearnerCourse: protectedProcedure
    .input(getLearnerCourseSchema)
    .query(({ input, ctx }) =>
      getLearnerCourse(ctx.session.user.id, input.courseId),
    ),

  getLearnerSceneContent: protectedProcedure
    .input(getLearnerSceneContentSchema)
    .query(({ input, ctx }) =>
      getLearnerSceneContent(
        ctx.session.user.id,
        input.courseId,
        input.sceneId,
      ),
    ),
});
