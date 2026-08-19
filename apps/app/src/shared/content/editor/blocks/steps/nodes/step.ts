import type { NodeViewRenderer } from "@tiptap/core";

import { createBlockMarkdownSpec, mergeAttributes, Node } from "@tiptap/core";

import { NESTABLE_BLOCK_CONTENT } from "@/shared/content/editor/blocks/registry/content-groups";
import { STEP_NODE_NAME } from "@/shared/content/editor/blocks/steps/schema";

type StepNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const stepNode = Node.create({
  name: STEP_NODE_NAME,

  content: NESTABLE_BLOCK_CONTENT,

  isolating: true,

  addAttributes() {
    return {
      label: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-label") ?? "",
        renderHTML: (attributes) => ({ "data-label": attributes.label }),
      },
    };
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Step",
      description:
        "A single step of a steps block. The step number is rendered automatically from its position; holds block-level content.",
      attributes: [
        {
          attr: "data-type",
          value: "step",
          description: "Identifies this div as a step",
        },
        {
          attr: "data-label",
          description:
            'Optional short label shown above the step content, e.g. a year ("1969") or a phase name. Leave empty for plain numbered steps.',
        },
      ],
    };
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": STEP_NODE_NAME }),
      0,
    ];
  },

  parseHTML() {
    return [{ tag: 'div[data-type="step"]' }];
  },

  ...createBlockMarkdownSpec({
    nodeName: STEP_NODE_NAME,
    name: "step",
    content: "block",
    allowedAttributes: ["label"],
  }),
});

export function createStepNode(options: StepNodeOptions = {}) {
  const nodeView = options.nodeView;
  return stepNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
