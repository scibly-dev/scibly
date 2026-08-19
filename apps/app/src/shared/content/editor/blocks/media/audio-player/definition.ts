import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createAudioPlayerNode } from "./node";

const audioPlayerNode = createAudioPlayerNode();

export const audioPlayerDefinition = new BlockDefinition({
  name: audioPlayerNode.name,
  ownerPath: "media/audio-player",
  slot: "content",
  mediaHtmlTag: "audio",
  mediaOrder: 30,
  slashCommands: [
    {
      group: "media",
      order: 30,
      name: "audioPlayer",
      iconName: "AudioLines",
      aliases: ["audio", "musik", "podcast"],
      copy: {
        de: {
          label: "Audio",
          description:
            "Lade eigene Audiodateien hoch oder bette sie aus dem Web ein.",
        },
        en: {
          label: "Audio",
          description:
            "Upload your own audio files or embed them from the web.",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().insertAudioPlayer().run();
      },
    },
  ],
  extensions: [
    nodeEntry(audioPlayerNode, (nodeView) =>
      createAudioPlayerNode({ nodeView }),
    ),
  ],
});
