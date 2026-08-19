import type { NodeViewRenderer } from "@tiptap/core";

import {
  createInlineMarkdownSpec,
  InputRule,
  mergeAttributes,
  Node,
} from "@tiptap/core";
import katex from "katex";

import getDefaultReactBlockAttributes, {
  type BaseReactBlockAttributes,
  getNodeAttributes,
} from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { INLINE_MATH_NODE_NAME } from "@/shared/content/editor/blocks/math/inline-math/schema";
import {
  type _MathBlockAttributes,
  defaultData,
} from "@/shared/content/editor/blocks/math/utils/math-block-attributes";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineMath: {
      insertInlineMath: (formula?: string) => ReturnType;
    };
  }
}

export const INPUT_REGEX = /\$(.*?)\$/gi;

export type MathBlockAttributes = BaseReactBlockAttributes &
  _MathBlockAttributes;

type InlineMathNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const inlineMathNode = Node.create({
  name: INLINE_MATH_NODE_NAME,

  group: "inline",

  atom: true,

  inline: true,

  selectable: false,

  addAttributes() {
    return {
      ...getDefaultReactBlockAttributes(),
      formula: {
        default: defaultData,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type='${INLINE_MATH_NODE_NAME}']`,
      },
    ];
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ node, HTMLAttributes }) {
    const attrs = getNodeAttributes<_MathBlockAttributes>(node);
    const formula = attrs.formula;

    const renderedFormula = katex.renderToString(formula, {
      displayMode: false,
      throwOnError: false,
    });
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": INLINE_MATH_NODE_NAME,
      }),
      new DOMParser().parseFromString(renderedFormula, "text/html").body,
    ];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "span",
      name: "Inline Math",
      description:
        "An inline LaTeX math formula rendered using KaTeX. Appears within a line of text.",
      attributes: [
        {
          attr: "data-type",
          value: INLINE_MATH_NODE_NAME,
          description: "Identifies this span as an inline math node",
        },
        {
          attr: "formula",
          description: "The LaTeX formula string to render",
        },
      ],
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: INPUT_REGEX,
        handler({ range, match, chain }) {
          const content = match[1];
          if (!content) return;
          chain()
            .command(({ tr }) => {
              tr.deleteRange(range.from, range.to);
              return true;
            })
            .insertInlineMath(content)
            .run();
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertInlineMath:
        (formula?: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              formula: formula ?? "",
            },
          });
        },
    };
  },

  ...createInlineMarkdownSpec({
    nodeName: INLINE_MATH_NODE_NAME,
    name: "inlineMath",
    selfClosing: true,
    allowedAttributes: ["formula"],
  }),
});

export function createInlineMathNode(options: InlineMathNodeOptions = {}) {
  const nodeView = options.nodeView;
  return inlineMathNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
