import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { QuestionBlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createClozeGapNode } from "./cloze-gap/node";
import { createClozeTextNode } from "./node";
import { ClozeTextParser } from "./parser/grading";
import { CLOZE_TEXT_NODE_NAME } from "./schema";

const clozeGapNode = createClozeGapNode();
const clozeTextNode = createClozeTextNode();

export const clozeTextDefinition = new QuestionBlockDefinition({
  name: CLOZE_TEXT_NODE_NAME,
  ownerPath: "cloze-text",
  contractOrder: 40,
  slot: "content",
  scene: true,
  stableId: true,
  stableIdOrder: 40,
  slashCommands: [
    {
      group: "question",
      order: 30,
      name: "cloze text",
      iconName: "SpellCheck2",
      aliases: ["cloze", "lückentext", "word bank", "wortauswahl", "lücken"],
      copy: {
        de: {
          label: "Lückentext",
          description: "Lückentext mit Wortauswahl",
        },
        en: {
          label: "Cloze text",
          description: "Fill gaps by tapping words from a word bank",
        },
      },
      action: (editor) => {
        editor.chain().focus().insertClozeText().run();
      },
    },
  ],
  extensions: [
    nodeEntry(clozeGapNode, (nodeView) => createClozeGapNode({ nodeView })),
    nodeEntry(clozeTextNode, (nodeView) => createClozeTextNode({ nodeView })),
  ],
  parser: new ClozeTextParser(),
  presentation: {
    analyticsLabel: "Cloze Text",
    iconName: "SpellCheck2",
    userFriendlyName: "Lückentext",
  },
});
