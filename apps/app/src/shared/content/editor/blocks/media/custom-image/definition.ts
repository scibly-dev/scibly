import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createCustomImageNode } from "./node";

const customImageNode = createCustomImageNode();

export const customImageDefinition = new BlockDefinition({
  name: customImageNode.name,
  ownerPath: "media/custom-image",
  slot: "content",
  mediaHtmlTag: "img",
  mediaOrder: 10,
  slashCommands: [
    {
      group: "media",
      order: 10,
      name: "image",
      iconName: "Image",
      aliases: ["bild"],
      copy: {
        de: {
          label: "Bild",
          description:
            "Lade eigene Bilder hoch oder bette sie aus dem Web ein.",
        },
        en: {
          label: "Image",
          description: "Upload your own images or embed them from the web.",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().insertImage().run();
      },
    },
  ],
  extensions: [
    nodeEntry(customImageNode, (nodeView) =>
      createCustomImageNode({ nodeView }),
    ),
  ],
});
