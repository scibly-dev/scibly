import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { QuestionBlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createInputFieldNode } from "./node";
import { InputFieldParser } from "./parser/grading";
import { INPUT_FIELD_NODE_NAME } from "./schema";

const inputFieldNode = createInputFieldNode();

export const inputFieldDefinition = new QuestionBlockDefinition({
  name: INPUT_FIELD_NODE_NAME,
  ownerPath: "input-field",
  contractOrder: 10,
  slot: "content",
  scene: true,
  stableId: true,
  stableIdOrder: 10,
  slashCommands: [
    {
      group: "question",
      order: 10,
      name: "input field",
      iconName: "TextCursorInput",
      aliases: ["eingabefeld", "input", "answer", "antwort", "fill in"],
      copy: {
        de: { label: "Eingabefeld", description: "Ideal für kurze Antworten" },
        en: { label: "Input field", description: "Best for short answers" },
      },
      action: (editor) => {
        editor.chain().focus().insertInputField().run();
      },
    },
  ],
  extensions: [
    nodeEntry(inputFieldNode, (nodeView) => createInputFieldNode({ nodeView })),
  ],
  parser: new InputFieldParser(),
  presentation: {
    analyticsLabel: "Input Field",
    iconName: "TextCursorInput",
    userFriendlyName: "Eingabefeld",
  },
});
