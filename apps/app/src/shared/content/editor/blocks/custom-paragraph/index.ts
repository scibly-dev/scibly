import type { ParagraphOptions } from "@tiptap/extension-paragraph";

import { mergeAttributes } from "@tiptap/core";
import { Paragraph as BaseParagraph } from "@tiptap/extension-paragraph";

import { CUSTOM_PARAGRAPH_NODE_NAME } from "@/shared/content/editor/blocks/custom-paragraph/schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paragraph: {
      setParagraph: () => ReturnType;
    };
  }
}

export const Paragraph = BaseParagraph.extend<ParagraphOptions>({
  name: CUSTOM_PARAGRAPH_NODE_NAME,

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  content: "inline*",

  parseHTML() {
    return [{ tag: "p" }];
  },

  renderMarkdown(node, helpers) {
    if (!node) return "";
    const content = Array.isArray(node.content) ? node.content : [];
    if (content.length === 0) {
      return "&nbsp;";
    }
    return helpers.renderChildren(content);
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: "display: block;",
      }),
      0,
    ];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "p",
      name: "Paragraph",
      description:
        "The default block-level text container. Use for regular body text and inline content.",
    };
  },

  addCommands() {
    return {
      setParagraph:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "Mod-Alt-0": () => this.editor.commands.setParagraph(),
    };
  },
});
