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

// The procedure is public, so an anonymous learner picks this size.
const MAX_PRACTICE_WORK_BYTES = 64 * 1024;

export const completeSceneSchema = getLearnerProgressSchema.and(
  z.object({
    lessonId: z.string(),
    sceneId: z.string(),
    blocks: z.array(blockSubmissionSchema).optional(),
    practiceWork: z
      .unknown()
      .optional()
      .refine(
        (work) =>
          work === undefined ||
          new Blob([JSON.stringify(work) ?? ""]).size <=
            MAX_PRACTICE_WORK_BYTES,
        { message: "Practice submission is too large." },
      ),
  }),
);
