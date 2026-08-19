import type { Editor } from "@tiptap/core";

import { NodeSelection, type Selection } from "@tiptap/pm/state";

// go up the to the parent node, if any (Will not select the document node.)
// for reference see: https://github.com/ProseMirror/prosemirror-commands/blob/43c118ffc9d1e8a097a320d07e430e2faf861778/src/commands.ts#L409
const getParentPos = (selection: Selection) => {
  const { $from, to } = selection;
  const same = $from.sharedDepth(to);
  if (same == 0) return false;
  const pos = $from.before(same);
  return pos;
};

export const goNodeUp = (editor: Editor, selection: Selection) => {
  const pos = getParentPos(selection);
  if (pos === false) return null;
  if (!editor.view.state.doc) return null;

  try {
    const sel = NodeSelection.create(editor.view.state.doc, pos);
    const node = sel.node;
    return {
      node: node,
      selection: sel,
    };
  } catch {
    return null;
  }
};

export const getNodeAndSelection = (
  editor: Editor,
  selection: Selection,
  nodeName: string,
) => {
  let currentNode = goNodeUp(editor, selection);

  while (currentNode && currentNode.node.type.name !== nodeName) {
    currentNode = goNodeUp(editor, currentNode.selection);
  }

  if (!currentNode) return null;

  return {
    node: currentNode.node,
    selection: currentNode.selection,
  };
};
