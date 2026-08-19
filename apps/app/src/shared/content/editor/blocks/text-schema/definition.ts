import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Subscript from "@tiptap/extension-subscript";
import SuperScript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";

import { CUSTOM_PARAGRAPH_NODE_NAME } from "@/shared/content/editor/blocks/custom-paragraph/schema";
import { extensionEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { FrameworkSchemaDefinition } from "@/shared/content/editor/blocks/registry/types";

import {
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  HardBreak,
  Heading,
  Highlight,
  Italic,
  Link,
  OrderedList,
  Strike,
  Text,
  Underline,
} from "./extensions";

export const textFoundationDefinition = new FrameworkSchemaDefinition({
  name: "text-schema",
  ownerPath: "text-schema",
  slot: "text",
  documentGroup: "block",
  slashCommands: [
    {
      group: "basics",
      order: 10,
      name: "heading1",
      iconName: "Heading1",
      aliases: ["h1", "überschrift1"],
      copy: {
        de: {
          label: "Überschrift 1",
          description: "Hoch priorisierte Abschnittsüberschrift",
        },
        en: {
          label: "Heading 1",
          description: "High-priority section heading",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().setHeading({ level: 1 }).run();
      },
    },
    {
      group: "basics",
      order: 20,
      name: "heading2",
      iconName: "Heading2",
      aliases: ["h2", "überschrift2"],
      copy: {
        de: {
          label: "Überschrift 2",
          description: "Mittlere Priorität Abschnittsüberschrift",
        },
        en: {
          label: "Heading 2",
          description: "Medium-priority section heading",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().setHeading({ level: 2 }).run();
      },
    },
    {
      group: "basics",
      order: 30,
      name: "heading3",
      iconName: "Heading3",
      aliases: ["h3", "überschrift3"],
      copy: {
        de: {
          label: "Überschrift 3",
          description: "Niedrige Priorität Abschnittsüberschrift",
        },
        en: {
          label: "Heading 3",
          description: "Low-priority section heading",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().setHeading({ level: 3 }).run();
      },
    },
    {
      group: "basics",
      order: 40,
      name: "bulletList",
      iconName: "List",
      aliases: ["ul", "unorderedlist", "unsortierteliste"],
      copy: {
        de: {
          label: "Unsortierte Liste",
          description: "Unsortierte Liste von Elementen",
        },
        en: {
          label: "Bullet list",
          description: "Unordered list of items",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().toggleBulletList().run();
      },
    },
    {
      group: "basics",
      order: 50,
      name: "numberedList",
      iconName: "ListOrdered",
      aliases: ["ol", "sortedlist", "sortierteliste", "nummerierteliste"],
      copy: {
        de: {
          label: "Nummerierte Liste",
          description: "Sortierte Liste von Elementen",
        },
        en: {
          label: "Numbered list",
          description: "Ordered list of items",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().toggleOrderedList().run();
      },
    },
    {
      group: "basics",
      order: 60,
      name: "blockquote",
      iconName: "Quote",
      aliases: [],
      copy: {
        de: { label: "Zitat", description: "Element für Zitat" },
        en: { label: "Quote", description: "Quote block element" },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().setBlockquote().run();
      },
    },
  ],
  extensions: [
    extensionEntry(
      Blockquote.configure({
        HTMLAttributes: { class: "border-l-4 pl-4" },
      }),
    ),
    extensionEntry(BulletList),
    extensionEntry(CodeBlock),
    extensionEntry(HardBreak),
    extensionEntry(OrderedList),
    extensionEntry(Text),
    extensionEntry(Bold),
    extensionEntry(Italic),
    extensionEntry(Link),
    extensionEntry(Strike),
    extensionEntry(Underline),
    extensionEntry(SuperScript),
    extensionEntry(Subscript),
  ],
});

export const richTextCodeDefinition = new FrameworkSchemaDefinition({
  name: "rich-text-schema",
  ownerPath: "text-schema",
  slot: "text",
  extensions: [extensionEntry(Code)],
});

export const richTextFormattingDefinition = new FrameworkSchemaDefinition({
  name: "rich-text-formatting-schema",
  ownerPath: "text-schema",
  slot: "text",
  extensions: [
    extensionEntry(Heading),
    extensionEntry(
      TextAlign.configure({
        types: ["heading", CUSTOM_PARAGRAPH_NODE_NAME],
      }),
    ),
    extensionEntry(FontFamily),
    extensionEntry(Highlight.configure({ multicolor: true })),
    extensionEntry(TextStyle),
    extensionEntry(Color),
  ],
});
