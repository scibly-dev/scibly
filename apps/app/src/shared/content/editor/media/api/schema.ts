import { z } from "zod";

import { mediaTypeSchema } from "@/lib/media-types";

const presignedUploadSchema = z.object({
  uploadId: z.string().min(1),
  mediaType: mediaTypeSchema,
});

export const createPresignedUrlSchema = z.object({
  useEditorBucket: z.boolean(),
  uploads: z.array(presignedUploadSchema).min(1).max(20),
});
export const deleteFileSchema = z.object({
  fileKey: z.string().min(1),
});
