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
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().url().nullable().optional(),
  passingScorePct: z.number().int().min(0).max(100).nullable().optional(),
  maxTries: z.number().int().min(1).nullable().optional(),
  allowAnonymous: z.boolean().optional(),
  mode: z.enum(CourseMode).optional(),
});
