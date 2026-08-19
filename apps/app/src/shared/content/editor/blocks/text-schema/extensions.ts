import _Blockquote from "@tiptap/extension-blockquote";
import _Bold from "@tiptap/extension-bold";
import _Code from "@tiptap/extension-code";
import _CodeBlock from "@tiptap/extension-code-block";
import _HardBreak from "@tiptap/extension-hard-break";
import _Heading from "@tiptap/extension-heading";
import _Highlight from "@tiptap/extension-highlight";
import _Italic from "@tiptap/extension-italic";
import _Link from "@tiptap/extension-link";
import {
  BulletList as _BulletList,
  OrderedList as _OrderedList,
} from "@tiptap/extension-list";
import _Strike from "@tiptap/extension-strike";
import _Text from "@tiptap/extension-text";
import _Underline from "@tiptap/extension-underline";

export const Blockquote = _Blockquote.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "blockquote",
    name: "Blockquote",
    description:
      "A block quotation. Displays content with a left border to indicate a quoted passage.",
  }),
});

export const BulletList = _BulletList.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "ul",
    name: "Bullet List",
    description: "An unordered list of items. Each item is a list item (<li>).",
  }),
});

export const CodeBlock = _CodeBlock.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "pre",
    name: "Code Block",
    description:
      "A multi-line block of preformatted code. Renders inside a <pre><code> structure.",
    attributes: [
      {
        attr: "data-language",
        description:
          'The programming language of the code block, e.g. "javascript" or "python"',
      },
    ],
  }),
});

export const HardBreak = _HardBreak.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "br",
    name: "Hard Break",
    description:
      "A forced line break inside a paragraph or other inline context.",
  }),
});

export const OrderedList = _OrderedList.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "ol",
    name: "Ordered List",
    description: "A numbered list of items. Each item is a list item (<li>).",
  }),
});

export const Text = _Text.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "span",
    name: "Text",
    description:
      "A plain text leaf node. The basic building block of all inline content.",
  }),
});

export const Bold = _Bold.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "strong",
    name: "Bold",
    description: "Makes inline text bold.",
  }),
});

export const Code = _Code.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "code",
    name: "Code",
    description:
      "Inline code mark. Wraps a short code snippet in a <code> tag.",
  }),
});

export const Italic = _Italic.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "em",
    name: "Italic",
    description: "Makes inline text italic.",
  }),
});

export const Link = _Link
  .extend({
    addHtmlSchemaAwareness: () => ({
      tag: "a",
      name: "Link",
      description: "Wraps inline text in a hyperlink.",
      attributes: [
        { attr: "href", description: "The URL the link points to" },
        {
          attr: "target",
          description: 'The link target, e.g. "_blank" to open in a new tab',
        },
        {
          attr: "rel",
          description: 'Link relationship, e.g. "noopener noreferrer"',
        },
      ],
    }),
  })
  .configure({ openOnClick: true });

export const Strike = _Strike.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "s",
    name: "Strike",
    description: "Applies strikethrough styling to inline text.",
  }),
});

export const Underline = _Underline.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "u",
    name: "Underline",
    description: "Underlines inline text.",
  }),
});

export const Highlight = _Highlight.extend({
  addHtmlSchemaAwareness: () => ({
    tag: "mark",
    name: "Highlight",
    description:
      "Highlights inline text with a colored background. Use for the single most important term or phrase in a passage.",
    attributes: [
      {
        attr: "data-color",
        description:
          'Optional highlight color as a CSS color value, e.g. "#fef08a". Omit for the default highlight color.',
      },
    ],
  }),
});

export const Heading = _Heading
  .extend({
    addHtmlSchemaAwareness: () => ({
      tag: "h1",
      name: "Heading",
      description:
        "A section heading. Levels 1 to 3 are supported (h1, h2, h3).",
      attributes: [
        {
          attr: "level",
          description: "The heading level. Must be one of: 1, 2, or 3",
        },
      ],
    }),
  })
  .configure({ levels: [1, 2, 3] });
