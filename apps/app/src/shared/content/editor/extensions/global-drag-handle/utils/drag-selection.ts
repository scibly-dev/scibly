import type { Node as PMNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

import { NodeSelection } from "@tiptap/pm/state";

import { CUSTOM_COLUMN_NODE_NAME } from "@/shared/content/editor/blocks/column/schema";
import { CUSTOM_FLASHCARD_NODE_NAME } from "@/shared/content/editor/blocks/flashcard/schema";
import { GUIDE_CHARACTER_NODE_NAME } from "@/shared/content/editor/blocks/guide-character/schema";

function adjustDragSelectionPos(
  view: EditorView,
  pos: number,
  _node: PMNode,
): number {
  let nodeSel = NodeSelection.create(view.state.doc, pos);

  if (nodeSel.node.type.isInline || nodeSel.node.type.name === "tableRow") {
    const $pos = view.state.doc.resolve(nodeSel.from);
    return $pos.before();
  }

  if (nodeSel.node.type.name === CUSTOM_COLUMN_NODE_NAME) {
    const dom = view.nodeDOM(pos);
    if (dom instanceof Element) {
      const rect = dom.getBoundingClientRect();
      const coords = view.posAtCoords({
        left: rect.left + rect.width / 2,
        top: rect.top + Math.min(rect.height / 2, 24),
      });
      if (coords) {
        return coords.inside ?? coords.pos;
      }
    }
  }

  const $pos = view.state.doc.resolve(nodeSel.from);

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const currentNode = $pos.node(depth);
    const typeName = currentNode.type.name;

    if (
      currentNode.isAtom &&
      currentNode.isBlock &&
      typeName !== GUIDE_CHARACTER_NODE_NAME
    ) {
      return $pos.before(depth);
    }

    if (typeName === CUSTOM_FLASHCARD_NODE_NAME) {
      return $pos.before(depth);
    }

    if (typeName === GUIDE_CHARACTER_NODE_NAME) {
      if (depth < $pos.depth) {
        return $pos.before($pos.depth);
      }
      break;
    }
  }

  return pos;
}

function createAdjustedNodeSelection(
  view: EditorView,
  pos: number,
  node: PMNode,
): NodeSelection | null {
  if (pos < 0) return null;

  try {
    const adjustedPos = adjustDragSelectionPos(view, pos, node);
    return NodeSelection.create(view.state.doc, adjustedPos);
  } catch {
    return null;
  }
}

export function applyDragHandleNodeSelection(
  view: EditorView,
  pos: number,
  node: PMNode,
): boolean {
  const selection = createAdjustedNodeSelection(view, pos, node);
  if (!selection) return false;

  view.dispatch(view.state.tr.setSelection(selection));
  return true;
}
