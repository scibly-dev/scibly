import {
  extensionEntry,
  nodeEntry,
} from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createFlashcardNode } from "./node";
import { FlashcardFace } from "./nodes/flashcard-face";
import { CUSTOM_FLASHCARD_NODE_NAME } from "./schema";

const flashcardNode = createFlashcardNode();

export const flashcardDefinition = new BlockDefinition({
  name: flashcardNode.name,
  ownerPath: "flashcard",
  slot: "content",
  documentGroup: CUSTOM_FLASHCARD_NODE_NAME,
  scene: true,
  slashCommands: [
    {
      group: "interactive",
      order: 20,
      name: "flashcard",
      iconName: "GalleryHorizontalEnd",
      aliases: ["flashcard", "karteikarte"],
      copy: {
        de: {
          label: "Lernkarte",
          description: "Interaktive Lernkarte (Flashcard)",
        },
        en: {
          label: "Lernkarte",
          description: "Interaktive Lernkarte (Flashcard)",
        },
      },
      shouldBeHidden: (editor) => editor.isActive("flashcard"),
      action: (editor) => {
        editor.chain().focus().insertFlashcard().run();
      },
    },
  ],
  extensions: [
    nodeEntry(flashcardNode, (nodeView) => createFlashcardNode({ nodeView })),
    extensionEntry(FlashcardFace),
  ],
});
