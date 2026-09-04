import { z } from "zod";

export const MIN_HEIGHT_PX = 200;
const MAX_HEIGHT_PX = 2000;

const practiceMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("scibly:height"), px: z.number() }),
  // `submit()` with no argument posts `undefined`, which the progression guard
  // drops silently — so it becomes `null` below.
  z.object({ type: z.literal("scibly:submit"), work: z.unknown().optional() }),
  z.object({
    type: z.literal("scibly:self-test-failed"),
    code: z.enum(["missing", "threw"]),
    detail: z.string().optional(),
  }),
]);

export type PracticeSelfTestFailure = {
  code: "missing" | "threw";
  detail: string | null;
};

export type PracticeMessage =
  | { type: "height"; px: number }
  | { type: "submit"; work: unknown }
  | ({ type: "self-test-failed" } & PracticeSelfTestFailure);

export function parsePracticeMessage(data: unknown): PracticeMessage | null {
  const parsed = practiceMessageSchema.safeParse(data);
  if (!parsed.success) return null;
  const message = parsed.data;
  if (message.type === "scibly:height") {
    return {
      type: "height",
      px: Math.min(MAX_HEIGHT_PX, Math.max(MIN_HEIGHT_PX, message.px)),
    };
  }
  if (message.type === "scibly:self-test-failed") {
    return {
      type: "self-test-failed",
      code: message.code,
      detail: message.detail ?? null,
    };
  }
  return { type: "submit", work: message.work ?? null };
}
