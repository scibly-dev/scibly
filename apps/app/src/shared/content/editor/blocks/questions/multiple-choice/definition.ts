import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { QuestionBlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createMultipleChoiceNode } from "./node";
import { MultipleChoiceParser } from "./parser/grading";
import { MULTIPLE_CHOICE_NODE_NAME } from "./schema";

const multipleChoiceNode = createMultipleChoiceNode();

export const multipleChoiceDefinition = new QuestionBlockDefinition({
  name: MULTIPLE_CHOICE_NODE_NAME,
  ownerPath: "multiple-choice",
  contractOrder: 20,
  slot: "content",
  scene: true,
  stableId: true,
  stableIdOrder: 20,
  slashCommands: [
    {
      group: "question",
      order: 20,
      name: "multiple choice",
      iconName: "ListChecks",
      aliases: ["multiple choice", "mc", "multiplechoice", "auswahl"],
      copy: {
        de: {
          label: "Multiple Choice",
          description: "Multiple-Choice-Frageblock",
        },
        en: {
          label: "Multiple choice",
          description: "Interactive multiple-choice block",
        },
      },
      action: (editor) => {
        editor.chain().focus().insertMultipleChoice().run();
      },
    },
  ],
  extensions: [
    nodeEntry(multipleChoiceNode, (nodeView) =>
      createMultipleChoiceNode({ nodeView }),
    ),
  ],
  parser: new MultipleChoiceParser(),
  presentation: {
    analyticsLabel: "Multiple Choice",
    iconName: "ListChecks",
    userFriendlyName: "Multiple Choice",
  },
});
