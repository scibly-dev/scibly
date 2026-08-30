import type { Content, JSONContent } from "@tiptap/core";
import type {
  LearnerQuestionBlock,
  QuestionBlockAttributes,
  QuestionBlockSnapshot,
} from "@/shared/content/contracts";

import { randomUUID } from "node:crypto";

import { isRawHtmlState } from "@scibly/lib/collab-yjs";
import { yDocToProsemirrorJSON } from "@tiptap/y-tiptap";

import "server-only";
import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import {
  applyAuthorDocumentUpdate,
  isBlankHtmlState,
  readQuestionBlockAttributes,
  requireQuestionBlockType,
  unreadableQuestionBlockError,
} from "@/shared/content/editor/documents/author-document";

const EMPTY_DOCUMENT: JSONContent = Object.freeze({
  type: "doc",
  content: [],
});

function parseAuthorDocument(
  documentState: Buffer | Uint8Array | null,
): JSONContent {
  if (!documentState || documentState.length === 0) return EMPTY_DOCUMENT;
  const state = new Uint8Array(documentState);
  if (isBlankHtmlState(state)) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  return yDocToProsemirrorJSON(applyAuthorDocumentUpdate(state), "default");
}

function isQuestionBlock(content: JSONContent): boolean {
  const value = content.attrs?.isQuestionBlock;
  return value === true || value === "true";
}

function normalizeQuestionIds(content: JSONContent): JSONContent {
  const copy = structuredClone(content);
  const visit = (node: JSONContent) => {
    if (isQuestionBlock(node)) {
      node.attrs = {
        ...node.attrs,
        id:
          typeof node.attrs?.id === "string" && node.attrs.id.length > 0
            ? node.attrs.id
            : randomUUID(),
      };
    }
    node.content?.forEach(visit);
  };
  visit(copy);
  return copy;
}

export function extractQuestionBlockSnapshotsFromTipTap(
  content: JSONContent,
): QuestionBlockSnapshot[] {
  const snapshots: QuestionBlockSnapshot[] = [];
  const visit = (node: JSONContent) => {
    if (isQuestionBlock(node)) {
      const blockId = node.attrs?.id;
      const attributes = readQuestionBlockAttributes(
        node.attrs?.questionBlockAttributes,
      );

      if (typeof blockId !== "string" || !node.type || !attributes) {
        throw unreadableQuestionBlockError(blockId);
      }
      snapshots.push({
        blockId,
        blockType: requireQuestionBlockType(node.type, blockId),
        attributes,
      });
    }
    node.content?.forEach(visit);
  };
  visit(content);
  return snapshots;
}

export function buildLearnerTipTapContent(
  content: JSONContent,
  learnerDocument: readonly LearnerQuestionBlock[],
): JSONContent {
  const attributesById = new Map(
    learnerDocument.map((block): [string, QuestionBlockAttributes] => [
      block.blockId,
      block.attributes,
    ]),
  );
  const copy = structuredClone(content);
  const visit = (node: JSONContent) => {
    const blockId = node.attrs?.id;
    const attributes =
      typeof blockId === "string" ? attributesById.get(blockId) : undefined;
    if (attributes) {
      node.attrs = {
        ...node.attrs,

        questionBlockAttributes: structuredClone(attributes),
      };

      node.content = questionBlockParserRegistry.stripSolutionFromContent(
        requireQuestionBlockType(node.type, blockId),
        node.content,
      );
    }
    node.content?.forEach(visit);
  };
  visit(copy);
  return copy;
}

export function normalizeAuthorTipTapContent(
  documentState: Buffer | Uint8Array | null,
): JSONContent {
  return normalizeQuestionIds(parseAuthorDocument(documentState));
}

export function getAuthorPreviewContent(
  documentState: Buffer | Uint8Array | null,
): Content {
  if (!documentState || documentState.length === 0) return EMPTY_DOCUMENT;
  const state = new Uint8Array(documentState);
  return isRawHtmlState(state)
    ? new TextDecoder().decode(state)
    : normalizeAuthorTipTapContent(state);
}
