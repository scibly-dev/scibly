import type { NodeViewRenderer } from "@tiptap/core";

import {
  createAtomBlockMarkdownSpec,
  mergeAttributes,
  Node,
  parseAttributes,
  serializeAttributes,
} from "@tiptap/core";

import { getMediaAttributes } from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { IMAGE_NODE_NAME } from "@/shared/content/editor/blocks/media/custom-image/schema";
import { MATCHING_PAIR_SIDE_MEDIA_GROUP } from "@/shared/content/editor/blocks/registry/content-groups";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      insertImage: () => ReturnType;
    };
  }
}

type CustomImageNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const customImageNode = Node.create({
  name: IMAGE_NODE_NAME,

  group: `block ${MATCHING_PAIR_SIDE_MEDIA_GROUP}`,

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      ...getDefaultReactBlockAttributes({ isResizable: true }),
    };
  },

  parseHTML() {
    return [
      {
        tag: "img",
      },
    ];
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ node, HTMLAttributes }) {
    const mediaAttrs = getMediaAttributes(node);
    return [
      "div",
      {
        style: `display: flex; justify-content: ${mediaAttrs.alignment}; align-items: center; max-width: 100%; position: relative; padding: 0.5rem 0;`,
      },
      [
        "img",
        mergeAttributes(HTMLAttributes, {
          src: mediaAttrs.src,
          style: `border-radius: 0.75rem;
        max-width: 100%;
        max-height: 100%;
        width: ${typeof mediaAttrs.width === "number" ? `${mediaAttrs.width}px` : mediaAttrs.width};
        height: ${typeof mediaAttrs.height === "number" ? `${mediaAttrs.height}px` : mediaAttrs.height};
        `,
        }),
      ],
    ];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "img",
      name: "Image",
      description:
        "An image block. Rendered as an <img> element inside an alignment wrapper div. Supports resizing and alignment.",
      attributes: [
        {
          attr: "src",
          description: "The URL of the image",
        },
        {
          attr: "style",
          description:
            "Inline styles for dimensions (width, height) and border radius",
        },
      ],
    };
  },

  addCommands() {
    return {
      insertImage:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },

  ...createAtomBlockMarkdownSpec({
    nodeName: IMAGE_NODE_NAME,
    name: "image",
    parseAttributes: (str) => {
      const parsed = parseAttributes(str);
      const { src, width, height, alignment, ...rest } = parsed;
      return {
        ...rest,
        mediaBlockAttributes: {
          src: src ?? null,
          width: width ?? "100%",
          height: height ?? "100%",
          alignment: alignment ?? "center",
        },
      };
    },
    serializeAttributes: (attrs) => {
      const { mediaBlockAttributes, ...rest } = attrs;
      const flattened = {
        ...rest,
        ...(mediaBlockAttributes || {}),
      };
      return serializeAttributes(flattened);
    },
  }),
});

export function createCustomImageNode(options: CustomImageNodeOptions = {}) {
  const nodeView = options.nodeView;
  return customImageNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
