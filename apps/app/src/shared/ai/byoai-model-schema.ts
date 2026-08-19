import { z } from "zod";

export const BYOAI_MODEL_DESCRIPTION_MAX_LENGTH = 80;

export const byoaiModelDescriptionSchema = z
  .string()
  .trim()
  .max(
    BYOAI_MODEL_DESCRIPTION_MAX_LENGTH,
    `Description must be ${BYOAI_MODEL_DESCRIPTION_MAX_LENGTH} characters or fewer`,
  )
  .transform((value) => value || undefined)
  .optional();

export const BYOAI_CONTEXT_WINDOW_MIN = 1_000;

export const BYOAI_CONTEXT_WINDOW_MAX = 10_000_000;

export const byoaiContextWindowFieldSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (/^\d+$/.test(value) && Number(value) >= BYOAI_CONTEXT_WINDOW_MIN),
    `Context window must be a whole number of at least ${BYOAI_CONTEXT_WINDOW_MIN.toLocaleString("en-US")} tokens`,
  )
  .refine(
    (value) => value === "" || Number(value) <= BYOAI_CONTEXT_WINDOW_MAX,
    `Context window must be at most ${BYOAI_CONTEXT_WINDOW_MAX.toLocaleString("en-US")} tokens`,
  )
  .optional();

export const byoaiContextWindowSchema = byoaiContextWindowFieldSchema.transform(
  (value) => {
    if (value === undefined) return undefined;
    return value === "" ? null : Number(value);
  },
);
