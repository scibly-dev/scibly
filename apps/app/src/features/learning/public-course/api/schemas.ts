import { AnonymousSessionSource } from "@scibly/db/enums";
import { z } from "zod";

export const startAnonymousSessionSchema = z.object({
  courseId: z.string(),
  anonymousId: z.string().min(1),
  reset: z.boolean().optional(),

  source: z.enum(AnonymousSessionSource).optional(),

  embedOrigin: z.string().nullish(),
});

export const completeAnonymousSessionSchema = z.object({
  courseId: z.string(),
  anonymousId: z.string().min(1),
});
