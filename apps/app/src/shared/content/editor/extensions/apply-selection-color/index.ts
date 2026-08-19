import { Extension } from "@tiptap/core";
import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
} from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

import {
  clearDragHandleSelectionActive,
  isDragHandleSelectionActive,
} from "@/shared/content/editor/extensions/global-drag-handle/state/selection-state";

const clickedDragHandle = (event: MouseEvent) => {
  return (
    event.target instanceof Element &&
    event.target.classList.contains("drag-handle")
  );
};

const removeSelectionOnClick = (view: EditorView, clickPos: number) => {
  const { tr } = view.state;
  const transaction = tr.setSelection(TextSelection.create(tr.doc, clickPos));
  view.dispatch(transaction);
};

export const ApplySelectionColorPlugin = Extension.create({
  name: "ApplySelectionColorPlugin",
  addProseMirrorPlugins() {
    const plugin = new PluginKey(this.name);
    let selectionHalos: HTMLDivElement[] = [];

    const removeSelectionHalo = () => {
      if (selectionHalos.length === 0) return;
      selectionHalos.forEach((selectionHalo) => selectionHalo.remove());
      selectionHalos = [];
    };

    const addSelectionHalo = (node: Element) => {
      const selectionHalo = document.createElement("div");
      selectionHalo.classList.add("selection-halo");
      selectionHalos.push(selectionHalo);
      node.appendChild(selectionHalo);
    };

    const removeProseMirrorSelection = (view: EditorView) => {
      const selectedNodes = view.dom.querySelectorAll(
        ".ProseMirror-selectednode",
      );
      selectedNodes.forEach((node) => {
        node.classList.remove("ProseMirror-selectednode");
      });
    };

    const applyCustomNodeHalo = (view: EditorView) => {
      if (!(view.state.selection instanceof NodeSelection)) return;

      const pmNode = view.state.selection.node;
      if (!pmNode.type.name.startsWith("custom-")) return;

      const domNode = view.nodeDOM(view.state.selection.from);
      if (!(domNode instanceof Element)) return;

      addSelectionHalo(domNode);
    };

    const globalClickHandler = (view: EditorView, event: MouseEvent) => {
      removeSelectionHalo();

      if (!clickedDragHandle(event)) {
        removeProseMirrorSelection(view);
        clearDragHandleSelectionActive();
        return;
      }

      applyCustomNodeHalo(view);
    };

    let documentClickHandler: ((event: MouseEvent) => void) | null = null;
    let editorView: EditorView | null = null;

    return [
      new Plugin({
        key: plugin,
        view: (view) => {
          editorView = view;
          documentClickHandler = (event: MouseEvent) => {
            globalClickHandler(view, event);
          };
          document.addEventListener("click", documentClickHandler);

          return {
            destroy: () => {
              removeSelectionHalo();
              clearDragHandleSelectionActive();

              if (documentClickHandler) {
                document.removeEventListener("click", documentClickHandler);
                documentClickHandler = null;
              }

              editorView = null;
            },
          };
        },
        appendTransaction() {
          if (!isDragHandleSelectionActive()) {
            return null;
          }

          const handleSelection = () => {
            const nodes = editorView?.dom?.querySelectorAll(
              ".ProseMirror-selectednode",
            );
            if (!nodes) return;

            nodes.forEach((node) => {
              const isAlreadySelected =
                node.classList.contains("tiptap-node-selection") ||
                node.querySelector(".selection-halo");
              if (isAlreadySelected) return;
              addSelectionHalo(node);
            });
          };

          setTimeout(() => handleSelection());
          return null;
        },
        props: {
          decorations(state) {
            if (!isDragHandleSelectionActive()) {
              return null;
            }

            if (state.selection.empty) {
              return null;
            }

            if (!(state.selection instanceof NodeSelection)) {
              return null;
            }

            const node = state.selection.node;
            if (node.type.name.startsWith("custom-")) {
              return null;
            }

            return DecorationSet.create(state.doc, [
              Decoration.node(state.selection.from, state.selection.to, {
                class: "tiptap-node-selection",
              }),
            ]);
          },
          handleClick(view, pos) {
            if (!view.state.selection.empty) {
              removeSelectionOnClick(view, pos);
            }

            if (!isDragHandleSelectionActive()) return;

            const selectedNodes = view.dom.querySelectorAll(
              ".tiptap-node-selection",
            );
            selectedNodes.forEach((node) => {
              node.classList.remove("tiptap-node-selection");
            });
          },
        },
      }),
    ];
  },
});

export default ApplySelectionColorPlugin;
