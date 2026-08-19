import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createHintNode } from "./node";

const hintNode = createHintNode();

export const hintDefinition = new BlockDefinition({
  name: hintNode.name,
  ownerPath: "hint",
  slot: "content",
  slashCommands: [
    {
      group: "interactive",
      order: 10,
      name: "hint",
      iconName: "EyeOff",
      aliases: ["hinweis"],
      copy: {
        de: { label: "Hinweis", description: "Hinweis für den Leser" },
        en: { label: "Hint", description: "Hint for the reader" },
      },
      action: (editor) => {
        editor.chain().focus().insertInlineHint().run();
      },
    },
  ],
  extensions: [nodeEntry(hintNode, (nodeView) => createHintNode({ nodeView }))],
});
