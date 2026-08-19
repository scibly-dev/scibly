import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import type { DragHandleTarget } from "@/shared/content/editor/extensions/global-drag-handle/types";

type DragHandleTargetListener = (
  target: DragHandleTarget,
  editor: Editor,
) => void;

let currentTarget: DragHandleTarget = null;
let currentEditor: Editor | null = null;
const listeners = new Set<DragHandleTargetListener>();

export function publishDragHandleTarget(
  editor: Editor,
  node: Node | null,
  pos: number,
) {
  currentEditor = editor;
  currentTarget =
    node && pos >= 0
      ? {
          node,
          pos,
        }
      : null;

  for (const listener of listeners) {
    listener(currentTarget, editor);
  }
}

export function getDragHandleTarget(): DragHandleTarget {
  return currentTarget;
}

export function getDragHandleEditor(): Editor | null {
  return currentEditor;
}
