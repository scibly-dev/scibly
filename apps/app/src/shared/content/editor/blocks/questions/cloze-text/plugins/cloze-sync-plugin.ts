import type { Editor } from "@tiptap/core";
import type { Attrs, Node as PMNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

import { isChangeOrigin } from "@tiptap/extension-collaboration";
import { Fragment } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { stringAttribute } from "@/shared/content/editor/blocks/attributes/string-attribute";
import { CLOZE_GAP_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/cloze-gap/schema";
import {
  CLOZE_TEXT_NODE_NAME,
  defaultQuestionData,
  getGapSegments,
  type QuestionData,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import {
  createBlockId,
  repairClozeQuestionData,
} from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-author";
import {
  buildClozeDocContent,
  deriveQuestionDataFromClozeNode,
  questionDataStructureFingerprint,
} from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-doc-sync";
import { normalizeAuthorSegments } from "@/shared/content/editor/blocks/questions/cloze-text/utils/segment-normalize";

/** Skips remote y-sync transactions and its own appended one, to avoid infinite loops. */

const CLOZE_SYNC_META = "clozeSync$applied";
const clozeSyncPluginKey = new PluginKey("clozeSync");

function attrsWithQuestionData(node: PMNode, questionData: QuestionData) {
  return {
    ...node.attrs,
    questionBlockAttributes: {
      ...node.attrs.questionBlockAttributes,
      questionData: {
        ...questionData,
        segments: normalizeAuthorSegments(questionData.segments),
      },
    },
  };
}

function collectGappyBlockIds(doc: PMNode): Set<string> {
  const ids = new Set<string>();
  doc.descendants((node) => {
    if (node.type.name !== CLOZE_TEXT_NODE_NAME) return true;
    let hasGap = false;
    node.descendants((child) => {
      if (child.type.name === CLOZE_GAP_NODE_NAME) hasGap = true;
    });
    const id = stringAttribute(node, "id");
    if (hasGap && id) ids.add(id);
    return false;
  });
  return ids;
}

function dedupGapIds(tr: Transaction, clozePos: number, node: PMNode): boolean {
  const seenGapIds = new Set<string>();
  const seenItemIds = new Set<string>();
  const ops: { pos: number; attrs: Attrs }[] = [];

  node.descendants((child, relPos) => {
    if (child.type.name !== CLOZE_GAP_NODE_NAME) return;
    const gapId = stringAttribute(child, "gapId");
    const itemId = stringAttribute(child, "correctItemId");
    const collides =
      !gapId || !itemId || seenGapIds.has(gapId) || seenItemIds.has(itemId);

    if (collides) {
      const newGapId = createBlockId("gap");
      const newItemId = createBlockId("item");
      ops.push({
        pos: clozePos + 1 + relPos,
        attrs: { ...child.attrs, gapId: newGapId, correctItemId: newItemId },
      });
      seenGapIds.add(newGapId);
      seenItemIds.add(newItemId);
    } else {
      seenGapIds.add(gapId);
      seenItemIds.add(itemId);
    }
  });

  for (const op of ops) {
    tr.setNodeMarkup(op.pos, undefined, op.attrs);
  }
  return ops.length > 0;
}

function syncClozeNode(
  editor: Editor,
  tr: Transaction,
  pos: number,
  previouslyGappyIds: Set<string>,
): boolean {
  let modified = dedupGapIds(tr, pos, tr.doc.nodeAt(pos)!);

  const node = tr.doc.nodeAt(pos);
  if (!node || node.type.name !== CLOZE_TEXT_NODE_NAME) return modified;

  const { questionBlockAttributes } = getNodeAttributes<{
    questionBlockAttributes?: { questionData?: QuestionData };
  }>(node);
  const questionData =
    questionBlockAttributes?.questionData ?? defaultQuestionData;

  let gapCount = 0;
  node.descendants((child) => {
    if (child.type.name === CLOZE_GAP_NODE_NAME) gapCount += 1;
  });
  const contentIsEmpty = gapCount === 0 && node.textContent.trim() === "";
  const attrsHasGaps = getGapSegments(questionData.segments).length > 0;
  const blockId = stringAttribute(node, "id");
  const wasGappy = blockId !== null && previouslyGappyIds.has(blockId);

  if (contentIsEmpty && attrsHasGaps && !wasGappy) {
    const repaired = repairClozeQuestionData(questionData);
    const nodes = buildClozeDocContent(repaired).map((json) =>
      editor.schema.nodeFromJSON(json),
    );
    tr.replaceWith(pos + 1, pos + node.nodeSize - 1, Fragment.fromArray(nodes));
    tr.setNodeMarkup(pos, undefined, attrsWithQuestionData(node, repaired));
    return true;
  }

  const derived = deriveQuestionDataFromClozeNode(node, questionData);
  if (
    questionDataStructureFingerprint(derived) !==
    questionDataStructureFingerprint(questionData)
  ) {
    tr.setNodeMarkup(pos, undefined, attrsWithQuestionData(node, derived));
    modified = true;
  }

  return modified;
}

export function createClozeSyncPlugin(editor: Editor): Plugin {
  return new Plugin({
    key: clozeSyncPluginKey,
    appendTransaction: (transactions, oldState, newState) => {
      if (!editor.isEditable) return null;
      if (transactions.some((tr) => isChangeOrigin(tr))) return null;
      if (transactions.some((tr) => tr.getMeta(CLOZE_SYNC_META))) return null;
      if (!transactions.some((tr) => tr.docChanged)) return null;

      const previouslyGappyIds = collectGappyBlockIds(oldState.doc);

      const positions: number[] = [];
      newState.doc.descendants((node, pos) => {
        if (node.type.name !== CLOZE_TEXT_NODE_NAME) return true;
        positions.push(pos);
        return false;
      });
      if (positions.length === 0) return null;

      const { tr } = newState;
      let modified = false;

      for (const pos of positions) {
        const mappedPos = tr.mapping.map(pos);
        const node = tr.doc.nodeAt(mappedPos);
        if (!node || node.type.name !== CLOZE_TEXT_NODE_NAME) continue;
        if (syncClozeNode(editor, tr, mappedPos, previouslyGappyIds)) {
          modified = true;
        }
      }

      if (!modified) return null;
      tr.setMeta(CLOZE_SYNC_META, true);
      return tr;
    },
  });
}
