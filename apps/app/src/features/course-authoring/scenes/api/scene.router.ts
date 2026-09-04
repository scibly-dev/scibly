import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";

import { broadcastCourseSync } from "@/features/course-authoring/collaboration/server/broadcast-course-sync";
import {
  cloneDraftScene,
  createDraftScene,
  deleteDraftScenes,
  getPractice,
  getSceneContent,
  getSceneLineage,
  getSceneLocation,
  listLessonScenes,
  reorderDraftScenes,
  resolveSceneDeletion,
  setDraftSceneLineage,
  updateDraftScene,
  validatePractice,
  writePractice,
  writeSceneContent,
} from "@/features/course-authoring/server";

import {
  cloneSceneSchema,
  createSceneSchema,
  deleteSceneSchema,
  getLessonScenesSchema,
  getPracticeSchema,
  getSceneContentSchema,
  reorderScenesSchema,
  resolveSceneDeletionSchema,
  setSceneLineageSchema,
  updateSceneSchema,
  validatePracticeInputSchema,
  writePracticeSchema,
  writeSceneContentSchema,
} from "./scene.schema";

// Broadcast from the server, not the browser: an agent editing over MCP has no browser.
const SCENES_CHANGED = [
  { type: "invalidate_scenes" },
  { type: "invalidate_course" },
] as const;

export const sceneRouter = createTRPCRouter({
  getLessonScenes: protectedProcedure
    .input(getLessonScenesSchema)
    .query(({ ctx, input }) => listLessonScenes(ctx.session.user.id, input)),

  updateScene: protectedProcedure
    .input(updateSceneSchema)
    .mutation(async ({ ctx, input }) => {
      const scene = await updateDraftScene(ctx.session.user, input);
      if (input.updates) {
        broadcastCourseSync(ctx.session.user, scene.courseId, {
          type: "update_scene",
          sceneId: input.sceneId,
          updates: input.updates,
        });
      }
      return scene;
    }),

  createScene: protectedProcedure
    .input(createSceneSchema)
    .mutation(async ({ ctx, input }) => {
      const scene = await createDraftScene(ctx.session.user.id, input);
      broadcastCourseSync(ctx.session.user, scene.courseId, ...SCENES_CHANGED);
      return scene;
    }),

  cloneScene: protectedProcedure
    .input(cloneSceneSchema)
    .mutation(async ({ ctx, input }) => {
      const scene = await cloneDraftScene(ctx.session.user.id, input.sceneId);
      broadcastCourseSync(ctx.session.user, scene.courseId, ...SCENES_CHANGED);
      return scene;
    }),

  deleteScene: protectedProcedure
    .input(deleteSceneSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await deleteDraftScenes(
        ctx.session.user.id,
        input.sceneIds,
      );
      const courseId = result.deleted[0]?.courseId;
      if (courseId) {
        broadcastCourseSync(ctx.session.user, courseId, ...SCENES_CHANGED);
      }
      return result;
    }),

  resolveSceneDeletion: protectedProcedure
    .input(resolveSceneDeletionSchema)
    .query(({ ctx, input }) =>
      resolveSceneDeletion(ctx.session.user.id, input.sceneIds),
    ),

  reorderScenes: protectedProcedure
    .input(reorderScenesSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await reorderDraftScenes(ctx.session.user.id, input);
      broadcastCourseSync(ctx.session.user, result.courseId, {
        type: "invalidate_scenes",
      });
      return result;
    }),

  setSceneLineage: protectedProcedure
    .input(setSceneLineageSchema)
    .mutation(({ ctx, input }) =>
      setDraftSceneLineage(ctx.session.user.id, input),
    ),

  writeSceneContent: protectedProcedure
    .input(writeSceneContentSchema)
    .mutation(({ ctx, input }) => writeSceneContent(ctx.session.user, input)),

  getSceneContent: protectedProcedure
    .input(getSceneContentSchema)
    .query(({ ctx, input }) =>
      getSceneContent(ctx.session.user, input.sceneId),
    ),

  getSceneLineage: protectedProcedure
    .input(getSceneContentSchema)
    .query(({ ctx, input }) =>
      getSceneLineage(ctx.session.user.id, input.sceneId),
    ),

  getSceneLocation: protectedProcedure
    .input(getSceneContentSchema)
    .query(({ ctx, input }) =>
      getSceneLocation(ctx.session.user.id, input.sceneId),
    ),

  getPractice: protectedProcedure
    .input(getPracticeSchema)
    .query(({ ctx, input }) => getPractice(ctx.session.user.id, input.sceneId)),

  writePractice: protectedProcedure
    .input(writePracticeSchema)
    .mutation(({ ctx, input }) => writePractice(ctx.session.user, input)),

  validatePractice: protectedProcedure
    .input(validatePracticeInputSchema)
    .mutation(({ ctx, input }) => validatePractice(ctx.session.user.id, input)),
});
