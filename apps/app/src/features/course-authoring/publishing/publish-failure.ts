import { z } from "zod";

const publishFailureSchema = z.object({
  details: z.object({
    code: z.string(),
    params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  }),
});

/** `force` only lifts the staleness gate — every other refusal would just repeat. */
export const FORCEABLE_PUBLISH_FAILURE = "OUTDATED_SCENES";

export type PublishFailure = {
  code: string;
  message: string;
};

export function translatePublishFailure(
  errorData: unknown,
  messages: Record<string, string | undefined>,
): PublishFailure | null {
  const parsed = publishFailureSchema.safeParse(errorData);
  if (!parsed.success) return null;
  const { code, params } = parsed.data.details;
  const template = messages[code];
  if (!template) return null;
  return {
    code,
    message: Object.entries(params ?? {}).reduce(
      (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
      template,
    ),
  };
}
