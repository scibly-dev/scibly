import { z } from "zod";

import { blockSubmissionSchema } from "@/shared/content/contracts";

export const previewSceneSchema = z.object({
  lessonId: z.string(),
  sceneId: z.string(),
  blocks: z.array(blockSubmissionSchema).optional(),
});
