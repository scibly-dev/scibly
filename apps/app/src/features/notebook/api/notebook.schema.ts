import { z } from "zod";

export const listNotebooksSchema = z.object({
  orgSlug: z.string(),
});

export const getNotebookSchema = z.object({
  orgSlug: z.string(),
  notebookId: z.string(),
});

export const ensureNotebookSchema = z.object({
  orgSlug: z.string(),
  notebookId: z.string().optional(),
  title: z.string().min(1).max(200).optional(),
});

export const updateNotebookSchema = z.object({
  orgSlug: z.string(),
  notebookId: z.string(),
  title: z.string().min(1).max(200),
});

export const deleteNotebookSchema = z.object({
  orgSlug: z.string(),
  notebookId: z.string(),
});

export const listOlderNotebookMessagesSchema = z.object({
  orgSlug: z.string(),
  notebookId: z.string(),
  beforeCursor: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
});
