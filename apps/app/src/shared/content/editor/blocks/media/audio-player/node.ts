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
import { AUDIO_PLAYER_NODE_NAME } from "@/shared/content/editor/blocks/media/audio-player/schema";
import { MATCHING_PAIR_SIDE_MEDIA_GROUP } from "@/shared/content/editor/blocks/registry/content-groups";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audioPlayer: {
      insertAudioPlayer: () => ReturnType;
    };
  }
}

type AudioPlayerNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const audioPlayerNode = Node.create({
  name: AUDIO_PLAYER_NODE_NAME,

  group: `block ${MATCHING_PAIR_SIDE_MEDIA_GROUP}`,

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      ...getDefaultReactBlockAttributes({ hasMediaAttributes: true }),
    };
  },

  parseHTML() {
    return [
      {
        tag: "audio",
      },
    ];
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ node, HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(HTMLAttributes, {
        src: getMediaAttributes(node).src,
        controls: true,
        style: "width: 100%;",
      }),
    ];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "audio",
      name: "Audio Player",
      description:
        "A block-level audio player. Rendered as an <audio> element inside an alignment wrapper div. Supports S3-hosted audio files and external audio URLs.",
      attributes: [
        {
          attr: "src",
          description: "The URL of the audio file",
        },
        {
          attr: "controls",
          description: "Whether native audio controls are shown",
        },
      ],
    };
  },

  addCommands() {
    return {
      insertAudioPlayer:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },

  ...createAtomBlockMarkdownSpec({
    nodeName: AUDIO_PLAYER_NODE_NAME,
    name: "audio",
    parseAttributes: (str) => {
      const parsed = parseAttributes(str);
      const { src, width, height, alignment, ...rest } = parsed;
      return {
        ...rest,
        mediaBlockAttributes: {
          src: src ?? null,
          width: width ?? "100%",
          height: height ?? "auto",
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

export function createAudioPlayerNode(options: AudioPlayerNodeOptions = {}) {
  const nodeView = options.nodeView;
  return audioPlayerNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
