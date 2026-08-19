import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

import { isNodeRangeSelection } from "@tiptap/extension-node-range";
import { NodeSelection } from "@tiptap/pm/state";

type ListSourceType = "OL" | "UL" | "";

let listSourceType: ListSourceType = "";

export function getListSourceType(): ListSourceType {
  return listSourceType;
}

export function clearListSourceType() {
  listSourceType = "";
}

function resolveListTypeFromPos($pos: ResolvedPos): ListSourceType {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const parentType = $pos.node(depth).type.name;
    if (parentType === "orderedList") return "OL";
    if (parentType === "bulletList") return "UL";
  }
  return "";
}

function resolveListSourceType(view: EditorView): ListSourceType {
  const { selection } = view.state;

  if (selection instanceof NodeSelection) {
    return resolveListTypeFromPos(view.state.doc.resolve(selection.from));
  }

  if (isNodeRangeSelection(selection)) {
    const firstRange = selection.ranges[0];
    if (firstRange) {
      return resolveListTypeFromPos(firstRange.$from);
    }
  }

  return "";
}

export function trackListSourceTypeFromSelection(view: EditorView) {
  listSourceType = resolveListSourceType(view);
}

export function trackListSourceTypeFromDragTarget(
  view: EditorView,
  node: PMNode,
  pos: number,
) {
  if (pos < 0) {
    listSourceType = "";
    return;
  }

  if (
    node.type.name === "listItem" ||
    node.type.name === "orderedList" ||
    node.type.name === "bulletList"
  ) {
    listSourceType = resolveListTypeFromPos(view.state.doc.resolve(pos));
    return;
  }

  listSourceType = resolveListTypeFromPos(
    view.state.doc.resolve(Math.min(pos + 1, view.state.doc.content.size)),
  );
}

export function isInsideListItem($pos: ResolvedPos): boolean {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if ($pos.node(depth).type.name === "listItem") {
      return true;
    }
  }
  return false;
}
