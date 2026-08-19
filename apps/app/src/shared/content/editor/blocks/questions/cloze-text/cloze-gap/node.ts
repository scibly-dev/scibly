import type { NodeViewRenderer } from "@tiptap/core";

import { mergeAttributes, Node } from "@tiptap/core";

import { CUSTOM_PARAGRAPH_NODE_NAME } from "@/shared/content/editor/blocks/custom-paragraph/schema";
import { CLOZE_GAP_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/cloze-gap/schema";
import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { createBlockId } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-author";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertClozeGap: {
      insertClozeGap: () => ReturnType;
    };
  }
}

type ClozeGapNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const clozeGapNode = Node.create({
  name: CLOZE_GAP_NODE_NAME,

  group: "inline",

  inline: true,

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      gapId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-gap-id"),
        renderHTML: (attributes) =>
          attributes.gapId ? { "data-gap-id": attributes.gapId } : {},
      },
      correctItemId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-correct-item-id"),
        renderHTML: (attributes) =>
          attributes.correctItemId
            ? { "data-correct-item-id": attributes.correctItemId }
            : {},
      },

      label: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-label") ?? "",
        renderHTML: (attributes) =>
          attributes.label ? { "data-label": attributes.label } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type='${CLOZE_GAP_NODE_NAME}']`,
      },
    ];
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": CLOZE_GAP_NODE_NAME,
      }),
    ];
  },

  addCommands() {
    return {
      insertClozeGap:
        () =>
        ({ chain, state, editor }) => {
          if (!editor.isActive(CLOZE_TEXT_NODE_NAME)) return false;
          if (!editor.isActive(CUSTOM_PARAGRAPH_NODE_NAME)) return false;

          const { from, to, empty } = state.selection;
          const selectedText = empty
            ? ""
            : state.doc.textBetween(from, to, "").trim();

          return chain()
            .focus()
            .deleteSelection()
            .insertContent({
              type: CLOZE_GAP_NODE_NAME,
              attrs: {
                gapId: createBlockId("gap"),
                correctItemId: createBlockId("item"),
                label: selectedText,
              },
            })
            .run();
        },
    };
  },
});

export function createClozeGapNode(options: ClozeGapNodeOptions = {}) {
  const nodeView = options.nodeView;
  return clozeGapNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
