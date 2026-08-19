import type { NodeViewRenderer } from "@tiptap/core";

import {
  createAtomBlockMarkdownSpec,
  InputRule,
  mergeAttributes,
  Node,
} from "@tiptap/core";
import katex from "katex";

import getDefaultReactBlockAttributes, {
  type BaseReactBlockAttributes,
  getNodeAttributes,
} from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { BLOCK_MATH_NODE_NAME } from "@/shared/content/editor/blocks/math/block-math/schema";
import {
  type _MathBlockAttributes,
  defaultData,
} from "@/shared/content/editor/blocks/math/utils/math-block-attributes";
import { MATCHING_PAIR_SIDE_MEDIA_GROUP } from "@/shared/content/editor/blocks/registry/content-groups";

const maxPrintableObjectWidthInPX = 800;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockMath: {
      insertBlockMath: (formula?: string) => ReturnType;
    };
  }
}

export const INPUT_REGEX = /\$\$(.*?)\$\$/gi;

export type MathBlockAttributes = BaseReactBlockAttributes &
  _MathBlockAttributes;

type BlockMathNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const blockMathNode = Node.create({
  name: BLOCK_MATH_NODE_NAME,

  group: `block ${MATCHING_PAIR_SIDE_MEDIA_GROUP}`,

  atom: true,

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
        tag: `div[data-type='${BLOCK_MATH_NODE_NAME}']`,
      },
    ];
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ node, HTMLAttributes }) {
    const attrs = getNodeAttributes<_MathBlockAttributes>(node);
    const formula = attrs.formula;

    const renderedFormula = katex.renderToString(formula, {
      displayMode: true,
      throwOnError: false,
    });
    return [
      "div",
      mergeAttributes(
        HTMLAttributes,
        { "data-type": BLOCK_MATH_NODE_NAME },
        { style: `width: 100%; max-width: ${maxPrintableObjectWidthInPX}px` },
      ),
      new DOMParser().parseFromString(renderedFormula, "text/html").body,
    ];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Block Math",
      description:
        "A block-level LaTeX math formula rendered in display mode using KaTeX. Occupies its own line and is centered.",
      attributes: [
        {
          attr: "data-type",
          value: BLOCK_MATH_NODE_NAME,
          description: "Identifies this div as a block math node",
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
            .insertBlockMath(content)
            .run();
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertBlockMath:
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

  ...createAtomBlockMarkdownSpec({
    nodeName: BLOCK_MATH_NODE_NAME,
    name: "blockMath",
    allowedAttributes: ["formula"],
  }),
});

export function createBlockMathNode(options: BlockMathNodeOptions = {}) {
  const nodeView = options.nodeView;
  return blockMathNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
