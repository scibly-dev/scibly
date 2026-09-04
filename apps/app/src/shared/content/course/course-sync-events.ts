import { z } from "zod";

import {
  updateCourseUpdatesSchema,
  updateLessonUpdatesSchema,
} from "@/shared/content/course/course-validation";
import { updateSceneUpdatesSchema } from "@/shared/content/course/scene-validation";

/** Stateless payloads broadcast on the `course-meta-<courseId>` collab room. */
export const syncEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("invalidate_course") }),
  z.object({
    type: z.literal("update_course"),
    updates: updateCourseUpdatesSchema,
  }),
  z.object({ type: z.literal("invalidate_lesson") }),
  z.object({ type: z.literal("invalidate_lessons") }),
  z.object({ type: z.literal("invalidate_scenes") }),
  z.object({ type: z.literal("invalidate_practice"), sceneId: z.string() }),
  z.object({
    type: z.literal("update_scene"),
    sceneId: z.string(),
    updates: updateSceneUpdatesSchema,
  }),
  z.object({
    type: z.literal("update_lesson"),
    updates: updateLessonUpdatesSchema,
  }),
]);

export type SyncEvent = z.infer<typeof syncEventSchema>;

export function courseMetadataRoom(courseId: string) {
  return `course-meta-${courseId}`;
}
