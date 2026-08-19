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
import { VIDEO_PLAYER_NODE_NAME } from "@/shared/content/editor/blocks/media/video-player/schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoPlayer: {
      insertVideoPlayer: () => ReturnType;
    };
  }
}

type VideoPlayerNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const videoPlayerNode = Node.create({
  name: VIDEO_PLAYER_NODE_NAME,

  group: "block",

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
        tag: "video",
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
        "video",
        mergeAttributes(HTMLAttributes, {
          src: mediaAttrs.src,
          style: `width: ${typeof mediaAttrs.width === "number" ? `${mediaAttrs.width}px` : mediaAttrs.width}; height: ${typeof mediaAttrs.height === "number" ? `${mediaAttrs.height}px` : mediaAttrs.height}; background-color: #DBDBDB; border-radius: 0.75rem;`,
        }),
      ],
    ];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "video",
      name: "Video Player",
      description:
        "A block-level video player. Rendered as a <video> element inside an alignment wrapper div. Supports resizing and alignment.",
      attributes: [
        {
          attr: "src",
          description: "The URL of the video",
        },
        {
          attr: "style",
          description:
            "Inline styles for dimensions (width, height) and alignment",
        },
      ],
    };
  },

  addCommands() {
    return {
      insertVideoPlayer:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },

  ...createAtomBlockMarkdownSpec({
    nodeName: VIDEO_PLAYER_NODE_NAME,
    name: "video",
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

export function createVideoPlayerNode(options: VideoPlayerNodeOptions = {}) {
  const nodeView = options.nodeView;
  return videoPlayerNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
