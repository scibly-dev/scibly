import { Extension } from "@tiptap/core";
import DragHandle from "@tiptap/extension-drag-handle";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";

import {
  createGuideExtractDropPlugin,
  trackGuideExtractFromDragTarget,
} from "@/shared/content/editor/extensions/global-drag-handle/plugins/guide-extract-drop";
import {
  createOrderedListDropFixPlugin,
  trackListSourceTypeFromDragTarget,
} from "@/shared/content/editor/extensions/global-drag-handle/plugins/list-drop-fix";
import { createMouseCoordsPlugin } from "@/shared/content/editor/extensions/global-drag-handle/plugins/mouse-coords";
import { sciblyDefaultDragRules } from "@/shared/content/editor/extensions/global-drag-handle/rules/scibly-default-rules";
import { sciblyDragRules } from "@/shared/content/editor/extensions/global-drag-handle/rules/scibly-drag-rules";
import {
  getDragHandleEditor,
  getDragHandleTarget,
  publishDragHandleTarget,
} from "@/shared/content/editor/extensions/global-drag-handle/state/selection-bridge";
import {
  clearDragHandleSelectionActive,
  isDragHandleSelectionActive,
  markDragHandleSelectionActive,
} from "@/shared/content/editor/extensions/global-drag-handle/state/selection-state";
import { shouldHideDragHandleAtCursor } from "@/shared/content/editor/extensions/global-drag-handle/utils/dom-guards";
import {
  getDragHandleOffsetMiddleware,
  getDragHandleVirtualElement,
} from "@/shared/content/editor/extensions/global-drag-handle/utils/drag-handle-position";
import { applyDragHandleNodeSelection } from "@/shared/content/editor/extensions/global-drag-handle/utils/drag-selection";

function clearNodeSelectionOnHover(
  editor: ReturnType<typeof getDragHandleEditor>,
  nodePos: number,
) {
  if (!editor || editor.view.dragging) return;
  if (isDragHandleSelectionActive()) return;

  const { selection } = editor.state;
  if (!(selection instanceof NodeSelection)) return;
  if (selection.from === nodePos) return;

  const fallbackPos = nodePos >= 0 ? nodePos : editor.state.selection.from;

  editor.view.dispatch(
    editor.state.tr.setSelection(
      TextSelection.create(editor.state.doc, fallbackPos),
    ),
  );
  clearDragHandleSelectionActive();
}

function renderDragHandleElement() {
  const element = document.createElement("div");
  element.classList.add("drag-handle");
  element.draggable = true;
  element.dataset.dragHandle = "";

  element.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const target = getDragHandleTarget();
    const editor = getDragHandleEditor();
    if (!target || !editor) return;

    editor.view.focus();
    if (applyDragHandleNodeSelection(editor.view, target.pos, target.node)) {
      markDragHandleSelectionActive();
      trackListSourceTypeFromDragTarget(editor.view, target.node, target.pos);
      trackGuideExtractFromDragTarget(editor.view, target.node, target.pos);
    }
  });

  return element;
}

export const GlobalDragHandle = Extension.create({
  name: "globalDragHandle",

  addExtensions() {
    return [
      DragHandle.configure({
        render: renderDragHandleElement,
        computePositionConfig: {
          placement: "left-start",
          strategy: "fixed",
          middleware: [getDragHandleOffsetMiddleware()],
        },
        getReferencedVirtualElement: getDragHandleVirtualElement,
        nested: {
          defaultRules: false,
          rules: [...sciblyDefaultDragRules, ...sciblyDragRules],
          edgeDetection: "none",
        },
        onNodeChange: (options) => {
          const { editor, node } = options;
          const nodePos =
            "pos" in options && typeof options.pos === "number"
              ? options.pos
              : -1;

          if (!node || nodePos < 0) {
            publishDragHandleTarget(editor, null, -1);
            return;
          }

          if (!editor.isEditable || shouldHideDragHandleAtCursor()) {
            publishDragHandleTarget(editor, null, -1);
            clearNodeSelectionOnHover(editor, -1);
            editor.view.dispatch(
              editor.state.tr.setMeta("hideDragHandle", true),
            );
            return;
          }

          publishDragHandleTarget(editor, node, nodePos);
          clearNodeSelectionOnHover(editor, nodePos);
        },
        onElementDragStart: () => {
          const target = getDragHandleTarget();
          const editor = getDragHandleEditor();
          if (!target || !editor) return;

          if (
            applyDragHandleNodeSelection(editor.view, target.pos, target.node)
          ) {
            markDragHandleSelectionActive();
            trackListSourceTypeFromDragTarget(
              editor.view,
              target.node,
              target.pos,
            );
            trackGuideExtractFromDragTarget(
              editor.view,
              target.node,
              target.pos,
            );
          }
        },
        onElementDragEnd: () => {
          clearDragHandleSelectionActive();
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      createGuideExtractDropPlugin(),
      createMouseCoordsPlugin(),
      createOrderedListDropFixPlugin(),
    ];
  },
});

export default GlobalDragHandle;
