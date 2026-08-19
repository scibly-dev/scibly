import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { QuestionBlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createStepsNode } from "./node";
import { createStepNode } from "./nodes/step";
import { StepsParser } from "./parser/grading";
import { STEPS_NODE_NAME } from "./schema";

const stepsNode = createStepsNode();
const stepNode = createStepNode();

export const stepsDefinition = new QuestionBlockDefinition({
  name: stepsNode.name,
  ownerPath: "steps",
  slot: "content",
  contractOrder: 70,
  scene: true,
  stableId: true,
  stableIdOrder: 65,
  slashCommands: [
    {
      group: "interactive",
      order: 40,
      name: "steps",
      iconName: "ListOrdered",
      aliases: [
        "step by step",
        "process",
        "timeline",
        "zeitstrahl",
        "schritte",
        "ablauf",
      ],
      copy: {
        de: {
          label: "Schritt für Schritt",
          description: "Schritte oder Meilensteine als interaktiver Ablauf",
        },
        en: {
          label: "Step by Step",
          description: "Steps or milestones as an interactive process",
        },
      },
      shouldBeHidden: (editor) => editor.isActive(STEPS_NODE_NAME),
      action: (editor) => {
        editor.chain().focus().insertSteps().run();
      },
    },
  ],
  extensions: [
    nodeEntry(stepsNode, (nodeView) => createStepsNode({ nodeView })),
    nodeEntry(stepNode, (nodeView) => createStepNode({ nodeView })),
  ],
  parser: new StepsParser(),
  presentation: {
    analyticsLabel: "Steps",
    iconName: "ListOrdered",
    userFriendlyName: "Schritt für Schritt",
  },
});
