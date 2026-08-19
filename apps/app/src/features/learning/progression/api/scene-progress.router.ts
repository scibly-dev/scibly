import { AppError } from "@scibly/api/application-error";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@scibly/api/trpc";

import {
  completeSceneSchema,
  getLearnerProgressSchema,
} from "@/features/learning/progression/api/schemas";
import {
  completeAnonymousSessionSchema,
  startAnonymousSessionSchema,
} from "@/features/learning/public-course/api/schemas";
import {
  completeAnonymousLearningSession,
  completeAnonymousScene,
  completeMemberScene,
  getAnonymousLearnerProgress,
  getMemberLearnerProgress,
  getMemberLearnerProgressByCourseId,
  previewScene,
  startAnonymousLearningSession,
} from "@/features/learning/server";

import { previewSceneSchema } from "./scene-progress.schema";

export const sceneProgressRouter = createTRPCRouter({
  previewScene: protectedProcedure
    .input(previewSceneSchema)
    .mutation(({ input, ctx }) => previewScene(ctx.session.user.id, input)),

  completeScene: publicProcedure
    .input(completeSceneSchema)
    .mutation(async ({ input, ctx }) => {
      const { enrollmentId, courseId, anonymousId, lessonId, sceneId, blocks } =
        input;

      if (enrollmentId) {
        if (!ctx.session?.user) {
          throw new AppError({
            code: "UNAUTHORIZED",
            applicationCode: "api.unauthorized",
            message: "You must be signed in to access this enrollment.",
          });
        }
        return completeMemberScene(
          {
            userId: ctx.session.user.id,
            enrollmentId,
          },
          {
            lessonId,
            sceneId,
            blocks,
          },
        );
      }
      return completeAnonymousScene(
        ctx.headers,
        {
          courseId: courseId!,
          anonymousId: anonymousId!,
        },
        {
          lessonId,
          sceneId,
          blocks,
        },
      );
    }),

  getLearnerProgress: publicProcedure
    .input(getLearnerProgressSchema)
    .query(async ({ input, ctx }) => {
      const { enrollmentId, courseId, anonymousId } = input;

      if (enrollmentId) {
        if (!ctx.session?.user) {
          throw new AppError({
            code: "UNAUTHORIZED",
            applicationCode: "api.unauthorized",
            message: "You must be signed in to access this enrollment.",
          });
        }
        return getMemberLearnerProgress(ctx.session.user.id, enrollmentId);
      }
      if (anonymousId) {
        return getAnonymousLearnerProgress(courseId!, anonymousId);
      }
      if (!ctx.session?.user) {
        throw new AppError({
          code: "UNAUTHORIZED",
          applicationCode: "api.unauthorized",
          message: "You must be signed in to access this course.",
        });
      }
      return getMemberLearnerProgressByCourseId(ctx.session.user.id, courseId!);
    }),

  startAnonymousSession: publicProcedure
    .input(startAnonymousSessionSchema)
    .mutation(({ input, ctx }) =>
      startAnonymousLearningSession(ctx.headers, input),
    ),

  completeAnonymousSession: publicProcedure
    .input(completeAnonymousSessionSchema)
    .mutation(({ input, ctx }) =>
      completeAnonymousLearningSession(ctx.headers, input),
    ),
});
