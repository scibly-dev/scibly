import type { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

import { NodeSelection } from "@tiptap/pm/state";

type EditorDraggingState = {
  slice: Slice;
  move: boolean;
  node?: NodeSelection;
};

export function getEditorDragging(
  view: EditorView,
): EditorDraggingState | null {
  // SAFETY: adds the `node` the comment above describes. Every read of it goes

  return view.dragging as EditorDraggingState | null;
}

export function getDraggingNodeSelection(
  view: EditorView,
): NodeSelection | null {
  const selection = getEditorDragging(view)?.node;
  return selection instanceof NodeSelection ? selection : null;
}

export function setEditorDragging(
  view: EditorView,
  state: EditorDraggingState,
) {
  // SAFETY: `dragging` is declared readonly, but ProseMirror's own drop handler

  (view as EditorView & { dragging: EditorDraggingState | null }).dragging =
    state;
}
