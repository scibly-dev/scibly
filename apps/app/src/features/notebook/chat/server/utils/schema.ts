import { z } from "zod";

import { type NotebookMessage } from "@/features/notebook/chat/contracts";
import { generateImageInputSchema } from "@/features/notebook/media/tools/image-schemas";

const messagePart = z.custom<NotebookMessage["parts"][number]>(
  (part) => typeof part === "object" && part !== null,
);

// The one place a request body becomes a `NotebookMessage` — the SDK's own part
// union is too wide to restate here, so parts are taken on trust once the envelope validates.
const uiMessageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    parts: z.array(messagePart),
  })
  .loose()
  .transform((message): NotebookMessage => message);

const focusedItem = z.object({
  id: z.string(),
  title: z.string().max(200),
});

// Exactly one of `message` (a new user turn) or `messages` (full history, for a
// tool-approval continuation) is expected — not enforced by this schema.
export const streamChatSchema = z.object({
  notebookId: z.string().optional(),
  orgSlug: z.string(),

  message: uiMessageSchema.optional(),
  messages: z.array(uiMessageSchema).max(500).optional(),

  modelId: z.string().optional(),

  imageEdit: generateImageInputSchema.optional(),

  courseContext: z
    .object({
      course: focusedItem,
      lesson: focusedItem.optional(),
      scene: focusedItem.optional(),
    })
    .optional(),
});

export type StreamChatInput = z.infer<typeof streamChatSchema>;
