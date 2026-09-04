import { practiceSolutionSchema } from "../../../../api/scene.schema";

export function parseSolution(text: string) {
  if (!text.trim()) return { status: "empty" } as const;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { status: "error", code: "json", detail: null } as const;
  }
  const parsed = practiceSolutionSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    return {
      status: "error",
      code: "schema",
      // Zod's own English: untranslated, but it names the offending key.
      detail: issue ? `${path ? `${path}: ` : ""}${issue.message}` : null,
    } as const;
  }
  if (!parsed.data) return { status: "empty" } as const;
  return {
    status: "ok",
    value: parsed.data,
    fields: Object.keys(parsed.data).length,
  } as const;
}
