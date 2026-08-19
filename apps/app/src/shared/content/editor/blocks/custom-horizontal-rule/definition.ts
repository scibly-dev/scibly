import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createHorizontalRuleNode } from "./node";

const horizontalRuleNode = createHorizontalRuleNode();

export const horizontalRuleDefinition = new BlockDefinition({
  name: horizontalRuleNode.name,
  ownerPath: "custom-horizontal-rule",
  slot: "text",
  slashCommands: [
    {
      group: "basics",
      order: 70,
      name: "divider",
      iconName: "Minus",
      aliases: [],
      copy: {
        de: {
          label: "Trennzeichen",
          description: "Horizontales Trennzeichen",
        },
        en: { label: "Divider", description: "Horizontal divider" },
      },
      shouldBeHidden: (editor) => editor.isActive("table"),
      action: (editor) => {
        editor.chain().focus().setHorizontalRule().run();
      },
    },
  ],
  extensions: [
    nodeEntry(horizontalRuleNode, (nodeView) =>
      createHorizontalRuleNode({ nodeView }),
    ),
  ],
});
