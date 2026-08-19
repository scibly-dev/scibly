import type { EditorView } from "@tiptap/pm/view";

import { isNodeRangeSelection } from "@tiptap/extension-node-range";
import { Fragment, type Node, Slice } from "@tiptap/pm/model";
import { NodeSelection, Plugin } from "@tiptap/pm/state";

import {
  getDraggingNodeSelection,
  getEditorDragging,
  setEditorDragging,
} from "@/shared/content/editor/extensions/global-drag-handle/state/dragging-state";
import {
  clearListSourceType,
  getListSourceType,
  isInsideListItem,
  trackListSourceTypeFromDragTarget,
  trackListSourceTypeFromSelection,
} from "@/shared/content/editor/extensions/global-drag-handle/state/list-context";

function getDraggedListItem(view: EditorView): Node | null {
  const draggingSelection = getDraggingNodeSelection(view);
  if (draggingSelection) {
    if (draggingSelection.node.type.name === "listItem") {
      return draggingSelection.node;
    }
  }

  const { selection } = view.state;

  if (
    selection instanceof NodeSelection &&
    selection.node.type.name === "listItem"
  ) {
    return selection.node;
  }

  if (isNodeRangeSelection(selection)) {
    const firstRange = selection.ranges[0];
    const node = firstRange?.$from.nodeAfter ?? firstRange?.$from.parent;
    if (node?.type.name === "listItem") {
      return node;
    }
  }

  return null;
}

function trackListSourceFromActiveDrag(view: EditorView) {
  const draggingSelection = getDraggingNodeSelection(view);
  if (draggingSelection) {
    trackListSourceTypeFromDragTarget(
      view,
      draggingSelection.node,
      draggingSelection.from,
    );
    return;
  }

  trackListSourceTypeFromSelection(view);
}

export function wrapSliceForOrderedListDrop(
  view: EditorView,
  event: Pick<DragEvent, "clientX" | "clientY" | "altKey">,
  slice: Slice,
): Slice {
  if (getListSourceType() !== "OL") {
    return slice;
  }

  const dropPos = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });
  if (!dropPos) {
    return slice;
  }

  const resolvedPos = view.state.doc.resolve(dropPos.pos);
  if (isInsideListItem(resolvedPos)) {
    return slice;
  }

  const listItem = getDraggedListItem(view) ?? slice.content.firstChild;
  if (!listItem || listItem.type.name !== "listItem") {
    return slice;
  }

  const newList = view.state.schema.nodes.orderedList?.createAndFill(
    null,
    listItem,
  );
  if (!newList) {
    return slice;
  }

  return new Slice(Fragment.from(newList), 0, 0);
}

export function createOrderedListDropFixPlugin() {
  return new Plugin({
    props: {
      handleDOMEvents: {
        dragstart(view) {
          trackListSourceTypeFromSelection(view);
          view.dom.classList.add("dragging");
          return false;
        },
        drop(view, event) {
          view.dom.classList.remove("dragging");
          trackListSourceFromActiveDrag(view);

          const droppedNode = getDraggedListItem(view);
          if (!droppedNode) {
            clearListSourceType();
            return false;
          }

          const currentDragging = getEditorDragging(view);
          const currentSlice = currentDragging?.slice;
          if (currentSlice) {
            const wrappedSlice = wrapSliceForOrderedListDrop(
              view,
              event,
              currentSlice,
            );

            if (!wrappedSlice.eq(currentSlice)) {
              setEditorDragging(view, {
                slice: wrappedSlice,
                move: !event.altKey,
                node: currentDragging?.node,
              });
            }
          }

          clearListSourceType();
          return false;
        },
        dragend(view) {
          view.dom.classList.remove("dragging");
          clearListSourceType();
          return false;
        },
      },
    },
  });
}

export { trackListSourceTypeFromDragTarget, trackListSourceTypeFromSelection };
