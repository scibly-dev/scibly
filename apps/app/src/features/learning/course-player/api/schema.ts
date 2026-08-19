import { z } from "zod";

export const getLearnerCourseSchema = z.object({ courseId: z.string() });

export const getLearnerSceneContentSchema = z.object({
  courseId: z.string(),
  sceneId: z.string(),
});
