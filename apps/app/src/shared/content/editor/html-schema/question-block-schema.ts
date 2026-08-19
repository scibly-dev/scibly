import type { HtmlAttribute } from "@/shared/content/editor/html-schema/types.d";

// Produces a TS-like shape string for a runtime value, e.g.
// `{ answer: string, caseSensitive: boolean }` for objects, `string[]` for arrays.
function describeType(value: unknown, depth = 0): string {
  if (depth > 5) return "any";
  if (value === null || value === undefined) return "any";
  if (Array.isArray(value)) {
    if (value.length === 0) return "any[]";
    return `${describeType(value[0], depth + 1)}[]`;
  }
  if (value instanceof Date) return "string";
  if (value instanceof Map || value instanceof Set) return "any";
  if (typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, v]) => `${key}: ${describeType(v, depth + 1)}`,
    );
    return `{ ${entries.join(", ")} }`;
  }
  return typeof value;
}

// Learner-only fields (`userAnswers`, `achievedPoints`) are intentionally
// omitted from agent schema awareness so the agent does not prefill learner state.
export function questionBlockSchemaAttribute(
  defaultQuestionData: unknown,
): HtmlAttribute {
  return {
    attr: "questionblock-data",
    description: [
      "JSON-encoded question block data with the following shape:",
      `  { optional: boolean, questionData: ${describeType(defaultQuestionData)}, maxPoints?: number, sp: number }`,
      "Set `questionData` to the correct solution.",
      "Set `maxPoints` when the block should award a specific point total; omit it to derive from `questionData`.",
      "Set `sp` to specify the Scibly Points reward (defaults to 10).",
      "CRITICAL: Always wrap this attribute in SINGLE quotes (e.g. questionblock-data='{...}') and use unescaped double quotes inside the JSON. Do not wrap in double quotes and backslash-escape the inner double quotes.",
    ].join("\n"),
  };
}
