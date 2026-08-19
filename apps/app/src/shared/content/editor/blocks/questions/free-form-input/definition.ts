import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { QuestionBlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createFreeFormInputNode } from "./node";
import { FreeFormInputParser } from "./parser/grading";
import { FREE_FORM_INPUT_NODE_NAME } from "./schema";

const freeFormInputNode = createFreeFormInputNode();

export const freeFormInputDefinition = new QuestionBlockDefinition({
  name: FREE_FORM_INPUT_NODE_NAME,
  ownerPath: "free-form-input",
  contractOrder: 50,
  slot: "content",
  scene: true,
  stableId: true,
  stableIdOrder: 50,
  slashCommands: [
    {
      group: "question",
      order: 50,
      name: "free form input",
      iconName: "FileText",
      aliases: ["free form input", "freitext", "textarea", "essay"],
      copy: {
        de: {
          label: "Freitextfeld",
          description: "Offenes Textfeld für freie Antworten",
        },
        en: {
          label: "Free form input",
          description: "Open-ended text area for free answers",
        },
      },
      action: (editor) => {
        editor.chain().focus().insertFreeFormInput().run();
      },
    },
  ],
  extensions: [
    nodeEntry(freeFormInputNode, (nodeView) =>
      createFreeFormInputNode({ nodeView }),
    ),
  ],
  parser: new FreeFormInputParser(),
  presentation: {
    analyticsLabel: "Free Form Input",
    iconName: "FileText",
    userFriendlyName: "Freitextfeld",
  },
});
