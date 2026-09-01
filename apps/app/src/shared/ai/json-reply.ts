import type { z } from "zod";

/**
 * The schema decides how much malformation is survivable — a lenient schema
 * turns a wrong reply into an empty one, which is only right when an empty
 * answer is itself a real answer.
 */
export function parseJsonReply<T>(raw: string, schema: z.ZodType<T>): T | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return schema.safeParse(JSON.parse(raw.slice(start, end + 1))).data ?? null;
  } catch {
    return null;
  }
}
