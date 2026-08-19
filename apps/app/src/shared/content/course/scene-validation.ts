import { SceneAnimation, SceneVibe } from "@scibly/db/enums";
import { z } from "zod";

export const sceneIntegrationSchema = z.object({
  hideCta: z.boolean().optional(),
  announcementText: z.string().optional(),
});

export type SceneIntegration = z.infer<typeof sceneIntegrationSchema>;

export const updateSceneUpdatesSchema = z.object({
  title: z.string().optional(),
  vibe: z.enum(SceneVibe).optional(),
  animation: z.enum(SceneAnimation).optional(),
  sp: z.number().int().nonnegative().optional(),
  integration: sceneIntegrationSchema.nullable().optional(),
});
