import { CourseMode } from "@scibly/db/enums";
import { z } from "zod";

export const createCourseEditFormSchema = (titleRequired: string) =>
  z.object({
    mode: z.enum(CourseMode),
    title: z.string().min(1, titleRequired),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()),
    passingScorePct: z.number().int().min(0).max(100).nullable(),
    maxTries: z.number().int().min(1).nullable(),
  });

export type CourseEditFormValues = z.infer<
  ReturnType<typeof createCourseEditFormSchema>
>;
