import type { QuestionBlockAttributes } from "@/shared/content/contracts";
import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import * as Y from "yjs";

import {
  questionBlockAttributesBaseSchema,
  questionBlockAttributesSchema,
} from "@/shared/content/contracts";
import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";

// Shared between the Yjs reader and the publish (TipTap) reader, so both give
// the same document the same answer.

function isRawHtmlState(state: Uint8Array): boolean {
  return state[0] === 0x3c;
}

export function isBlankHtmlState(state: Uint8Array): boolean {
  return (
    isRawHtmlState(state) &&
    new TextDecoder().decode(state).trim() === "<p></p>"
  );
}

export function applyAuthorDocumentUpdate(state: Uint8Array): Y.Doc {
  if (isRawHtmlState(state)) {
    throw new Error("Authoring document has not been synchronized to Yjs.");
  }
  const document = new Y.Doc();
  Y.applyUpdate(document, state);
  return document;
}

// Accepts both the object the collaborative editor writes and the serialized
// string older documents carry.
export function readQuestionBlockAttributes(
  value: unknown,
): QuestionBlockAttributes | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return readQuestionBlockAttributes(JSON.parse(value));
    } catch {
      return null;
    }
  }

  const parsed = questionBlockAttributesSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  const onlyZeroValueIssues = parsed.error.issues.every(
    (issue) =>
      issue.code === "custom" &&
      issue.path.length === 1 &&
      (issue.path[0] === "maxPoints" || issue.path[0] === "sp"),
  );
  if (!onlyZeroValueIssues) return null;

  const base = questionBlockAttributesBaseSchema.safeParse(value);
  return base.success ? base.data : null;
}

function nameOf(blockId: unknown): string {
  return typeof blockId === "string" && blockId.length > 0
    ? blockId
    : "(no id)";
}

export function unreadableQuestionBlockError(blockId: unknown): Error {
  return new Error(
    `Question block ${nameOf(blockId)} cannot be read: its attributes are unreadable.`,
  );
}

export function requireQuestionBlockType(
  nodeName: unknown,
  blockId: unknown,
): QuestionBlocksType {
  if (
    typeof nodeName === "string" &&
    editorSchemaRegistry.isQuestionName(nodeName)
  ) {
    return nodeName;
  }
  throw new Error(
    `Question block ${nameOf(blockId)} cannot be read: "${String(nodeName)}" is not a question type this build defines.`,
  );
}
