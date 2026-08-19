import { z } from "zod";

import { blockSubmissionSchema } from "@/shared/content/contracts";

export const getLearnerProgressSchema = z
  .object({
    enrollmentId: z.string().optional(),
    courseId: z.string().optional(),
    anonymousId: z.string().optional(),
  })
  .refine((data) => !!data.enrollmentId || !!data.courseId, {
    message: "Either enrollmentId or courseId must be provided",
  });

export const completeSceneSchema = getLearnerProgressSchema.and(
  z.object({
    lessonId: z.string(),
    sceneId: z.string(),
    blocks: z.array(blockSubmissionSchema).optional(),
  }),
);
