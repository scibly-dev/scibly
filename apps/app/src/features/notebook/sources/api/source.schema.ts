import { z } from "zod";

import {
  MAX_CHARS_PER_SOURCE,
  UPLOAD_SOURCE_TYPES,
} from "@/shared/content/sources/constants";

import {
  SEARCH_DEFAULT_TOP_K,
  SEARCH_MAX_TOP_K,
} from "../server/search-sources";

const sourceTypeSchema = z.enum(UPLOAD_SOURCE_TYPES);

export const uploadSourceSchema = z.object({
  notebookId: z.string(),
  fileName: z.string().min(1).max(500),
  fileSize: z.number().int().positive(),
  sourceType: sourceTypeSchema,
});

export const confirmUploadSchema = z.object({
  sourceId: z.string(),
  s3Key: z.string(),
});

export const addTextSourceSchema = z.object({
  notebookId: z.string(),
  name: z.string().min(1).max(500),

  content: z.string().min(1).max(MAX_CHARS_PER_SOURCE),
});

export const listSourcesSchema = z.object({
  notebookId: z.string(),
});

export const deleteSourceSchema = z.object({
  sourceId: z.string(),
});

export const retryIngestSchema = z.object({
  sourceId: z.string(),
});

export const refreshStaleSourcesSchema = z.object({
  notebookId: z.string(),
});

export const refreshStaleCourseSourcesSchema = z.object({
  courseId: z.string(),
});

export const failUploadSchema = z.object({
  sourceId: z.string(),
  error: z.string().max(2000),
});

export const searchSourcesSchema = z.object({
  notebookId: z.string(),
  query: z.string().min(1).max(2000),
  limit: z
    .number()
    .int()
    .min(1)
    .max(SEARCH_MAX_TOP_K)
    .optional()
    .default(SEARCH_DEFAULT_TOP_K),
});

export const readSourceSchema = z.object({
  notebookId: z.string(),
  sourceId: z.string(),

  offset: z
    .number()
    .int()
    .min(0)
    .max(MAX_CHARS_PER_SOURCE)
    .optional()
    .default(0),
});

export const getDownloadUrlSchema = z.object({
  sourceId: z.string(),
});

export const replaceSourceUploadSchema = z.object({
  sourceId: z.string(),
  fileName: z.string().min(1).max(500),
  fileSize: z.number().int().positive(),
  sourceType: sourceTypeSchema,
});

// Repeats the file the grant was issued for: the row is only rewritten once the replacement is actually in the bucket.
export const confirmReplaceUploadSchema = replaceSourceUploadSchema.extend({
  s3Key: z.string(),
});
