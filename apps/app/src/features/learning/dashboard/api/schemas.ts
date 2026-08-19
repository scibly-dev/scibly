import { z } from "zod";

export const getDashboardStatsSchema = z.object({ orgSlug: z.string() });

export const listEnrolledCoursesSchema = z.object({
  orgSlug: z.string(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.number().optional().default(0),
});
