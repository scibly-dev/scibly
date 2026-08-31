import { z } from "zod";

import { QUESTION_BLOCK_AUTHORING_FIELDS } from "@/shared/content/contracts";

/**
 * Strips `questionblock-data` down to the author-settable fields before
 * AI-agent-authored HTML reaches the editor, so the agent can't smuggle in
 * `userAnswers`/`achievedPoints` — solutions are a separate boundary, stripped
 * at publish time instead.
 */
export function stripLearnerStateFromQuestionBlocks(body: Element): void {
  for (const block of body.querySelectorAll("[questionblock-data]")) {
    const data = readQuestionBlockData(
      block.getAttribute("questionblock-data") ?? "",
    );

    const authoringData = Object.fromEntries(
      QUESTION_BLOCK_AUTHORING_FIELDS.filter((field) => data.has(field)).map(
        (field) => [field, data.get(field)],
      ),
    );
    block.setAttribute("questionblock-data", JSON.stringify(authoringData));
  }
}

const questionBlockData = z.record(z.string(), z.unknown());

function readQuestionBlockData(rawValue: string): Map<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
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
