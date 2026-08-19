import { nodeEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { QuestionBlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createDragAndDropNode } from "./node";
import { DragAndDropParser } from "./parser/grading";
import { DRAG_AND_DROP_NODE_NAME } from "./schema";

const dragAndDropNode = createDragAndDropNode();

export const dragAndDropDefinition = new QuestionBlockDefinition({
  name: DRAG_AND_DROP_NODE_NAME,
  ownerPath: "drag-and-drop",
  contractOrder: 30,
  slot: "content",
  scene: true,
  stableId: true,
  stableIdOrder: 30,
  slashCommands: [
    {
      group: "question",
      order: 40,
      name: "drag and drop",
      iconName: "GripHorizontal",
      aliases: ["drag", "drop", "drag and drop", "drag&drop", "zuordnen"],
      copy: {
        de: {
          label: "Drag & Drop",
          description: "Interaktives Drag & Drop",
        },
        en: {
          label: "Drag & Drop",
          description: "Interactive drag and drop block",
        },
      },
      action: (editor) => {
        editor.chain().focus().insertDragAndDrop().run();
      },
    },
  ],
  extensions: [
    nodeEntry(dragAndDropNode, (nodeView) =>
      createDragAndDropNode({ nodeView }),
    ),
  ],
  parser: new DragAndDropParser(),
  presentation: {
    analyticsLabel: "Drag & Drop",
    iconName: "GripHorizontal",
    userFriendlyName: "Drag & Drop",
  },
});
