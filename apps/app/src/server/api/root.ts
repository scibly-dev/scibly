import {
  createCallerFactory,
  createTRPCRouter,
  mergeTRPCRouters,
} from "@scibly/api/trpc";

import { collaborationRouter } from "@/features/course-authoring/collaboration/api/collaboration.router";
import { courseRouter } from "@/features/course-authoring/courses/api/course.router";
import { sceneRouter } from "@/features/course-authoring/scenes/api/scene.router";
import { healthRouter } from "@/features/health/api/health.router";
import { integrationRouter } from "@/features/integrations/server";
import { knowledgeRouter } from "@/features/knowledge/server";
import { learningRouter } from "@/features/learning/api/learning.router";
import { sceneProgressRouter } from "@/features/learning/progression/api/scene-progress.router";
import { notebookRouter } from "@/features/notebook/api/notebook.router";
import {
  billingRouter,
  orgAiConfigRouter,
  organizationRouter,
} from "@/features/organizations/server";
import { fileHandlerRouter } from "@/shared/content/editor/server";

const featureRouter = createTRPCRouter({
  collab: collaborationRouter,
  organization: organizationRouter,
  fileHandler: fileHandlerRouter,
  course: courseRouter,
  learning: learningRouter,
  notebook: notebookRouter,
  orgAiConfig: orgAiConfigRouter,
  billing: billingRouter,
  integration: integrationRouter,
  knowledge: knowledgeRouter,
  scene: sceneRouter,
  sceneProgress: sceneProgressRouter,
});

export const appRouter = mergeTRPCRouters(healthRouter, featureRouter);

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

export type TrpcCaller = ReturnType<typeof createCaller>;
