import { CourseMode, LessonIcon } from "@scibly/db/enums";
import { z } from "zod";

import { lessonDescriptionSchema } from "@/shared/content/learning/lesson-description";
import {
  DEFAULT_INK,
  DEFAULT_PRIMARY,
} from "@/shared/content/learning/scene-design";

export const lessonDesignSchema = z.object({
  backgroundColor: z.string(),
  textColor: z.string(),
  primaryColor: z.string(),
  fontFamily: z.string(),
});

export type LessonDesign = z.infer<typeof lessonDesignSchema>;

export const MODERN_MINIMAL_DESIGN: LessonDesign = {
  backgroundColor: "#ffffff",
  textColor: DEFAULT_INK,
  primaryColor: DEFAULT_PRIMARY,
  fontFamily: "var(--font-sans)",
};

export const updateLessonUpdatesSchema = z.object({
  title: z.string().min(1).optional(),
  description: lessonDescriptionSchema.optional(),
  icon: z.enum(LessonIcon).optional(),
  estimatedTimeToCompleteMinutes: z.number().min(0).optional(),
  design: lessonDesignSchema.nullable().optional(),
});

export const updateCourseUpdatesSchema = z.object({
  title: z.string().min(1).optional().describe("The title of the course."),
  description: z
    .string()
    .optional()
    .describe("A short summary of the content and learning goals."),
  category: z
    .string()
    .optional()
    .describe("The subject area, e.g. 'Engineering' or 'Design'."),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags for filtering and discovery. Replaces the existing tags."),
  thumbnail: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe("URL of the course's cover image, or null to remove it."),
  passingScorePct: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .optional()
    .describe(
      "Percentage a learner must score to pass, or null for no pass mark.",
    ),
  maxTries: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional()
    .describe(
      "How many attempts a learner gets, or null for unlimited attempts.",
    ),
  allowAnonymous: z.boolean().optional(),
  mode: z
    .enum(CourseMode)
    .optional()
    .describe(
      "LESSON for a course holding exactly one lesson, which opens straight into it; COURSE otherwise. Switching to LESSON is refused while the course has more than one draft lesson.",
    ),
});
