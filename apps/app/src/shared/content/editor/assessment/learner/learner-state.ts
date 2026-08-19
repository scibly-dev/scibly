import { z } from "zod";

import { QUESTION_BLOCK_AUTHORING_FIELDS } from "@/shared/content/contracts";

/**
 * Strips `questionblock-data` down to the author-settable fields before
 * AI-agent-authored HTML reaches the editor, so the agent can't smuggle in
 * `userAnswers`/`achievedPoints` — solutions are a separate boundary, stripped
 * at publish time instead.
 */
export function stripLearnerStateFromQuestionBlocks(html: string): string {
  return html.replace(
    /questionblock-data=(['"])([\s\S]*?)\1/g,
    (_match, quote: string, rawValue: string) => {
      const data = readQuestionBlockData(rawValue);

      const authoringData = Object.fromEntries(
        QUESTION_BLOCK_AUTHORING_FIELDS.filter((field) => data.has(field)).map(
          (field) => [field, data.get(field)],
        ),
      );
      return `questionblock-data=${quote}${encodeAttributeValue(JSON.stringify(authoringData), quote)}${quote}`;
    },
  );
}

const questionBlockData = z.record(z.string(), z.unknown());

function readQuestionBlockData(rawValue: string): Map<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeAttributeValue(rawValue));
  } catch {
    throw unreadable(rawValue);
  }
  const data = questionBlockData.safeParse(parsed);
  if (!data.success) throw unreadable(rawValue);
  return new Map(Object.entries(data.data));
}

function unreadable(rawValue: string): Error {
  return new Error(
    `A questionblock-data attribute could not be read, so no content was inserted: ${rawValue.slice(0, 200)}`,
  );
}

/**
 * Handles both encodings this value arrives in — the agent's raw
 * single-quoted JSON and the editor's double-quoted, escaped form — decoding
 * `&amp;` last so a literal `&amp;quot;` doesn't turn into a stray quote.
 */
function decodeAttributeValue(rawValue: string): string {
  return rawValue
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function encodeAttributeValue(value: string, quote: string): string {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return quote === '"'
    ? escaped.replace(/"/g, "&quot;")
    : escaped.replace(/'/g, "&#39;");
}
