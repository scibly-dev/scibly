import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createInlineMathNode } from "./node";

const inlineMathNode = createInlineMathNode();

export const inlineMathDefinition = new BlockDefinition({
  name: inlineMathNode.name,
  ownerPath: "math/inline-math",
  slot: "content",
  slashCommands: [
    {
      group: "advanced",
      order: 20,
      name: "inline equation",
      iconName: "Pi",
      aliases: [
        "math",
        "equation",
        "inline equation",
        "inlineequation",
        "inline math",
        "inlinemath",
        "inlinegleichung",
      ],
      copy: {
        de: {
          label: "Inline-Gleichung",
          description: "Mathematische Gleichung innerhalb des Fließtexts",
        },
        en: {
          label: "Inline equation",
          description: "Math equation inside running text",
        },
      },
      action: (editor) => {
        editor.chain().focus().insertInlineMath().run();
      },
    },
  ],
  extensions: [
    nodeEntry(inlineMathNode, (nodeView) => createInlineMathNode({ nodeView })),
  ],
});
