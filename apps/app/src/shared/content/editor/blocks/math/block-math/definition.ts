import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createBlockMathNode } from "./node";

const blockMathNode = createBlockMathNode();

export const blockMathDefinition = new BlockDefinition({
  name: blockMathNode.name,
  ownerPath: "math/block-math",
  slot: "content",
  slashCommands: [
    {
      group: "advanced",
      order: 10,
      name: "block equation",
      iconName: "Sigma",
      aliases: [
        "math",
        "equation",
        "block equation",
        "block math",
        "blockgleichung",
      ],
      copy: {
        de: {
          label: "Block-Gleichung",
          description: "Eigentständige mathematische Gleichung",
        },
        en: {
          label: "Block equation",
          description: "Standalone math equation",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().insertBlockMath().run();
      },
    },
  ],
  extensions: [
    nodeEntry(blockMathNode, (nodeView) => createBlockMathNode({ nodeView })),
  ],
});
