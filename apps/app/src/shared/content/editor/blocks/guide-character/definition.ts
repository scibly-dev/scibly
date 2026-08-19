import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createGuideCharacterNode } from "./node";
import { GUIDE_CHARACTER_GROUP } from "./schema";

const guideCharacterNode = createGuideCharacterNode();

export const guideCharacterDefinition = new BlockDefinition({
  name: guideCharacterNode.name,
  ownerPath: "guide-character",
  slot: "content",
  documentGroup: GUIDE_CHARACTER_GROUP,
  slashCommands: [
    {
      group: "interactive",
      order: 30,
      name: "guide character",
      iconName: "MessageCircle",
      aliases: ["guide", "character", "mascot", "figur"],
      copy: {
        de: {
          label: "Charakter",
          description: "Charakter mit Sprechblase für Tipps und Erklärungen",
        },
        en: {
          label: "Guide Character",
          description:
            "Friendly mascot with a speech bubble for tips and explanations",
        },
      },
      shouldBeHidden: (editor) =>
        editor.isActive("custom-guide-character") ||
        editor.isActive("flashcard"),
      action: (editor) => {
        editor.chain().focus().insertGuideCharacter().run();
      },
    },
  ],
  extensions: [
    nodeEntry(guideCharacterNode, (nodeView) =>
      createGuideCharacterNode({ nodeView }),
    ),
  ],
});
