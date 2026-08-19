import { z } from "zod";

export const issueRoomTokenSchema = z.object({
  room: z.string().min(1).max(512),
  kind: z.enum(["course-metadata", "scene-author", "scene-preview"]),
});
