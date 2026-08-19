import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createVideoPlayerNode } from "./node";

const videoPlayerNode = createVideoPlayerNode();

export const videoPlayerDefinition = new BlockDefinition({
  name: videoPlayerNode.name,
  ownerPath: "media/video-player",
  slot: "content",
  mediaHtmlTag: "video",
  mediaOrder: 20,
  slashCommands: [
    {
      group: "media",
      order: 20,
      name: "videoPlayer",
      iconName: "TvMinimalPlay",
      aliases: [],
      copy: {
        de: {
          label: "Video",
          description:
            "Lade eigene Videos hoch oder bette sie aus dem Web ein.",
        },
        en: {
          label: "Video",
          description: "Upload your own videos or embed them from the web.",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().insertVideoPlayer().run();
      },
    },
  ],
  extensions: [
    nodeEntry(videoPlayerNode, (nodeView) =>
      createVideoPlayerNode({ nodeView }),
    ),
  ],
});
