import { orgSlugInput } from "@scibly/schemas/organization";
import { z } from "zod";

import { BYOAI_MODEL_TYPES } from "@/shared/ai/byoai/types";
import {
  byoaiContextWindowSchema,
  byoaiModelDescriptionSchema,
} from "@/shared/ai/byoai-model-schema";

// Re-exported so call sites keep importing their own feature's schema module.
export { orgSlugInput };

export const addModelSchema = orgSlugInput
  .extend({
    name: z.string().min(1, "Name is required"),
    baseUrl: z.string().url("Must be a valid URL"),
    apiKey: z.string().optional(),
    modelId: z.string().min(1, "Model ID is required"),
    type: z.enum(BYOAI_MODEL_TYPES).default("CHAT"),
    description: byoaiModelDescriptionSchema,
    contextWindow: byoaiContextWindowSchema,
    reuseCredentialsFromId: z.string().optional(),
  })
  .refine(
    (data) => Boolean(data.apiKey?.trim() || data.reuseCredentialsFromId),
    { message: "API key is required", path: ["apiKey"] },
  );

export const updateModelSchema = orgSlugInput.extend({
  id: z.string(),
  name: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  description: byoaiModelDescriptionSchema.nullish(),
  contextWindow: byoaiContextWindowSchema.nullish(),
});

export const deleteModelSchema = orgSlugInput.extend({
  id: z.string(),
});

export const connectionInputSchema = orgSlugInput.extend({
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  modelId: z.string().min(1),
  type: z.enum(BYOAI_MODEL_TYPES),
  existingModelId: z.string().optional(),
});
