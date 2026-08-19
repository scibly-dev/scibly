import type { NodeViewRenderer } from "@tiptap/core";

import { createBlockMarkdownSpec, mergeAttributes, Node } from "@tiptap/core";

import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import {
  DEFAULT_GUIDE_LAYOUT,
  GUIDE_CHARACTER_GROUP,
  GUIDE_CHARACTER_NODE_NAME,
} from "@/shared/content/editor/blocks/guide-character/schema";
import { NESTABLE_BLOCK_CONTENT } from "@/shared/content/editor/blocks/registry/content-groups";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    guideCharacter: {
      insertGuideCharacter: () => ReturnType;
    };
  }
}

type GuideCharacterNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const guideCharacterNode = Node.create({
  name: GUIDE_CHARACTER_NODE_NAME,

  group: GUIDE_CHARACTER_GROUP,

  content: NESTABLE_BLOCK_CONTENT,

  isolating: true,

  addAttributes() {
    return {
      ...getDefaultReactBlockAttributes({ isResizable: false }),
      layout: {
        default: DEFAULT_GUIDE_LAYOUT,
        parseHTML: (element) =>
          element.getAttribute("data-layout") ?? DEFAULT_GUIDE_LAYOUT,
        renderHTML: (attributes) => ({
          "data-layout": attributes.layout,
        }),
      },
    };
  },

  addCommands() {
    return {
      insertGuideCharacter:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: GUIDE_CHARACTER_NODE_NAME,
            content: [{ type: "paragraph" }],
          }),
    };
  },

  addKeyboardShortcuts() {
    const modAKey = "Mod-a" as const;
    return {
      [modAKey]: ({ editor }) => {
        if (!editor.isActive(GUIDE_CHARACTER_NODE_NAME)) return false;
        const { state } = editor;
        const guide = getGuideCharacterDepth(state.selection.$from);
        if (guide === null) return false;
        const guideNode = state.selection.$from.node(guide);
        const start = state.selection.$from.start(guide);
        const end = start + guideNode.content.size;
        return editor.chain().setTextSelection({ from: start, to: end }).run();
      },
    };
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Guide Character",
      description:
        "A friendly mascot with a speech bubble for tips and explanations. Use for introductions, tips, encouragement, or examples. Supports paragraphs, media, questions, and flashcards inside the bubble.",
      attributes: [
        {
          attr: "data-type",
          value: GUIDE_CHARACTER_NODE_NAME,
          description: "Identifies this block as a guide character",
        },
        {
          attr: "data-layout",
          description: "Speech bubble layout: left, right, top, or inline",
        },
      ],
    };
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": GUIDE_CHARACTER_NODE_NAME,
      }),
      0,
    ];
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${GUIDE_CHARACTER_NODE_NAME}"]`,
      },
    ];
  },

  ...createBlockMarkdownSpec({
    nodeName: GUIDE_CHARACTER_NODE_NAME,
    name: "guide",
    content: "block",
    allowedAttributes: ["layout"],
  }),
});

export function createGuideCharacterNode(
  options: GuideCharacterNodeOptions = {},
) {
  const nodeView = options.nodeView;
  return guideCharacterNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}

function getGuideCharacterDepth($from: {
  depth: number;
  node: (depth: number) => { type: { name: string } };
}) {
  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name === GUIDE_CHARACTER_NODE_NAME) {
      return depth;
    }
  }
  return null;
}
