import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";

import {
  cloneDraftScene,
  createDraftScene,
  deleteDraftScenes,
  getSceneContent,
  getSceneLineage,
  getSceneLocation,
  listLessonScenes,
  reorderDraftScenes,
  resolveSceneDeletion,
  setDraftSceneLineage,
  updateDraftScene,
  writeSceneContent,
} from "@/features/course-authoring/server";

import {
  cloneSceneSchema,
  createSceneSchema,
  deleteSceneSchema,
  getLessonScenesSchema,
  getSceneContentSchema,
  reorderScenesSchema,
  resolveSceneDeletionSchema,
  setSceneLineageSchema,
  updateSceneSchema,
  writeSceneContentSchema,
} from "./scene.schema";

export const sceneRouter = createTRPCRouter({
  getLessonScenes: protectedProcedure
    .input(getLessonScenesSchema)
    .query(({ ctx, input }) => listLessonScenes(ctx.session.user.id, input)),

  updateScene: protectedProcedure
    .input(updateSceneSchema)
    .mutation(({ ctx, input }) => updateDraftScene(ctx.session.user, input)),

  createScene: protectedProcedure
    .input(createSceneSchema)
    .mutation(({ ctx, input }) => createDraftScene(ctx.session.user.id, input)),

  cloneScene: protectedProcedure
    .input(cloneSceneSchema)
    .mutation(({ ctx, input }) =>
      cloneDraftScene(ctx.session.user.id, input.sceneId),
    ),

  deleteScene: protectedProcedure
    .input(deleteSceneSchema)
    .mutation(({ ctx, input }) =>
      deleteDraftScenes(ctx.session.user.id, input.sceneIds),
    ),

  resolveSceneDeletion: protectedProcedure
    .input(resolveSceneDeletionSchema)
    .query(({ ctx, input }) =>
      resolveSceneDeletion(ctx.session.user.id, input.sceneIds),
    ),

  reorderScenes: protectedProcedure
    .input(reorderScenesSchema)
    .mutation(({ ctx, input }) =>
      reorderDraftScenes(ctx.session.user.id, input),
    ),

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
});
