import type {
  QuestionBlockAttributes,
  QuestionBlockSnapshot,
} from "@/shared/content/contracts";

import * as Y from "yjs";

import {
  applyAuthorDocumentUpdate,
  isBlankHtmlState,
  readQuestionBlockAttributes,
  requireQuestionBlockType,
  unreadableQuestionBlockError,
} from "@/shared/content/editor/documents/author-document";

export function walkYjsXmlTree(
  node: Y.XmlFragment | Y.XmlElement,
  callback: (element: Y.XmlElement) => void,
) {
  for (let index = 0; index < node.length; index++) {
    const child = node.get(index);
    if (child instanceof Y.XmlElement) {
      callback(child);
      walkYjsXmlTree(child, callback);
    }
  }
}

export function isQuestionBlockElement(element: Y.XmlElement): boolean {
  const attribute: unknown = element.getAttribute("isQuestionBlock");
  return attribute === true || attribute === "true";
}

export function getQuestionBlockAttributes(
  element: Y.XmlElement,
): QuestionBlockAttributes | null {
  return readQuestionBlockAttributes(
    element.getAttribute("questionBlockAttributes"),
  );
}

// Throws rather than returning [] for an unreadable document: silently
// treating it as "no questions" would let a scene grade as empty.
export function extractQuestionBlockSnapshots(
  documentState: Buffer | Uint8Array | null,
): QuestionBlockSnapshot[] {
  if (!documentState || documentState.length === 0) return [];
  const state = new Uint8Array(documentState);
  if (isBlankHtmlState(state)) return [];

  const document = applyAuthorDocumentUpdate(state);
  const snapshots: QuestionBlockSnapshot[] = [];
  walkYjsXmlTree(document.getXmlFragment("default"), (child) => {
    if (!isQuestionBlockElement(child)) return;
    const blockId = child.getAttribute("id");
    const attributes = getQuestionBlockAttributes(child);
    if (typeof blockId !== "string" || blockId.length === 0 || !attributes) {
      throw unreadableQuestionBlockError(blockId);
    }

    snapshots.push({
      blockId,
      blockType: requireQuestionBlockType(child.nodeName, blockId),
      attributes,
    });
  });
  return snapshots;
}
