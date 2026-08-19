import type { Node as PMNode } from "@tiptap/pm/model";

import { Node } from "@tiptap/core";
import { createBlockMarkdownSpec } from "@tiptap/core";

import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import {
  CUSTOM_COLUMN_NODE_NAME,
  CUSTOM_COLUMNS_NODE_NAME,
} from "@/shared/content/editor/blocks/column/schema";
import {
  getNodeAndSelection,
  goNodeUp,
} from "@/shared/content/editor/runtime/get-node-and-selection";

const isColumnEmpty = (node: PMNode | null) => {
  if (!node) return true;
  return node.childCount === 1 && node.firstChild?.nodeSize === 2;
};

export enum ColumnLayout {
  SidebarLeft = "sidebar-left",
  SidebarRight = "sidebar-right",
  TwoColumn = "two-column",
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      setColumns: () => ReturnType;
      setLayout: (layout: ColumnLayout) => ReturnType;
    };
  }
}

export const Columns = Node.create({
  name: CUSTOM_COLUMNS_NODE_NAME,

  group: "columns",

  content: `${CUSTOM_COLUMN_NODE_NAME} ${CUSTOM_COLUMN_NODE_NAME}`,

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      layout: {
        default: ColumnLayout.TwoColumn,
      },
    };
  },

  addCommands() {
    return {
      setColumns:
        () =>
        ({ commands }) =>
          commands.insertContent(
            `<div data-type="columns"><div data-type="column" data-position="left"><p></p></div><div data-type="column" data-position="right"><p></p></div></div>`,
          ),
      setLayout:
        (layout: ColumnLayout) =>
        ({ commands }) =>
          commands.updateAttributes("columns", { layout }),
    };
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-type": "columns", class: `layout-${HTMLAttributes.layout}` },
      0,
    ];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Two-Column Layout",
      description:
        "A container that splits content into two side-by-side columns. Contains exactly two column divs (left and right).",
      attributes: [
        {
          attr: "data-type",
          value: "columns",
          description: "Identifies this div as a two-column layout container",
        },
        {
          attr: "class",
          description:
            'Layout variant class. Can be one of: "layout-two-column", "layout-sidebar-left", or "layout-sidebar-right"',
        },
      ],
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },
  addKeyboardShortcuts() {
    return {
      /* eslint-disable @typescript-eslint/naming-convention */
      Backspace: () => {
        if (!this.editor?.isActive("columns")) return false;
        const sel = this.editor.state.selection;

        if (sel.$from.depth === 1) {
          this.editor.commands.deleteSelection();
          this.editor.commands.focus(sel.from + 2);
          return false;
        }

        const currentCol = getNodeAndSelection(
          this.editor,
          sel,
          CUSTOM_COLUMN_NODE_NAME,
        );

        if (!currentCol) return false;

        if (isColumnEmpty(currentCol.node)) {
          const { position: emptyNodePosition } = getNodeAttributes<{
            position: "left" | "right";
          }>(currentCol.node);
          const columns = goNodeUp(this.editor, currentCol.selection);
          if (!columns) return false;
          const remainingCol =
            emptyNodePosition === "left"
              ? columns.node.lastChild
              : columns.node.firstChild;
          this.editor.commands.deleteNode("columns");

          if (!remainingCol) return false;
          this.editor.commands.insertContent(remainingCol.content.toJSON());
          return true;
        }
        return false;
      },
      "Mod-a": () => {
        if (!this.editor?.isActive("columns")) return false;
        return this.editor.commands.selectParentNode();
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    };
  },

  ...createBlockMarkdownSpec({
    nodeName: CUSTOM_COLUMNS_NODE_NAME,
    name: "columns",
    content: "block",
    allowedAttributes: ["layout"],
  }),
});

export default Columns;
