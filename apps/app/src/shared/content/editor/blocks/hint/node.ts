import type { NodeViewRenderer } from "@tiptap/core";

import { createInlineMarkdownSpec, mergeAttributes, Node } from "@tiptap/core";

import getDefaultReactBlockAttributes, {
  type BaseReactBlockAttributes,
} from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { INLINE_HINT_NODE_NAME } from "@/shared/content/editor/blocks/hint/schema";

type _HintBlockAttributes = {
  content: string;
  isRevealed: boolean;
  learnerRevealed: boolean;
};

export type HintBlockAttributes = BaseReactBlockAttributes &
  _HintBlockAttributes;

export const defaultData: _HintBlockAttributes = {
  content: "",
  isRevealed: false,
  learnerRevealed: false,
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineHint: {
      insertInlineHint: (content?: string) => ReturnType;
    };
  }
}

type HintNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const hintNode = Node.create({
  name: INLINE_HINT_NODE_NAME,

  group: "inline",

  atom: true,

  inline: true,

  selectable: false,

  addAttributes() {
    return {
      ...getDefaultReactBlockAttributes(),
      content: {
        default: defaultData.content,
      },
      isRevealed: {
        default: defaultData.isRevealed,
      },
      learnerRevealed: {
        default: defaultData.learnerRevealed,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: this.name,
      },
    ];
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [this.name, mergeAttributes(HTMLAttributes)];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: INLINE_HINT_NODE_NAME,
      name: "Inline Hint",
      description:
        "An inline, toggleable hint element. When revealed, it displays a short text hint to the learner. Rendered as a custom element inside inline content.",
      attributes: [
        {
          attr: "content",
          description: "The hint text shown when the hint is revealed",
        },
        {
          attr: "isrevealed",
          description:
            "Whether the hint is revealed in editor/author view. Boolean (true or false)",
        },
        {
          attr: "learnerrevealed",
          description:
            "Whether the hint is revealed in learner view. Boolean (true or false)",
        },
      ],
    };
  },

  addCommands() {
    return {
      insertInlineHint:
        (content) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              content: content ?? defaultData.content,
            },
          });
        },
    };
  },

  ...createInlineMarkdownSpec({
    nodeName: INLINE_HINT_NODE_NAME,
    name: "hint",
    selfClosing: true,
    allowedAttributes: ["content", "isRevealed", "learnerRevealed"],
  }),
});

export function createHintNode(options: HintNodeOptions = {}) {
  const nodeView = options.nodeView;
  return hintNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
