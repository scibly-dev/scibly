import { extensionEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { Column } from "./nodes/column";
import { Columns } from "./nodes/columns";
import { CUSTOM_COLUMNS_NODE_NAME } from "./schema";

export const columnsDefinition = new BlockDefinition({
  name: CUSTOM_COLUMNS_NODE_NAME,
  ownerPath: "column",
  slot: "text",
  documentGroup: CUSTOM_COLUMNS_NODE_NAME,
  slashCommands: [
    {
      group: "advanced",
      order: 30,
      name: "columns",
      iconName: "Columns2",
      aliases: ["cols", "spalten"],
      copy: {
        de: {
          label: "Spalten",
          description: "Füge zwei nebeneinander liegende Spalten hinzu",
        },
        en: {
          label: "Columns",
          description: "Insert two side-by-side columns",
        },
      },
      shouldBeHidden: (editor) =>
        editor.isActive("columns") || editor.isActive("table"),
      action: (editor) => {
        editor
          .chain()
          .focus()
          .setColumns()
          .focus(editor.state.selection.head - 1)
          .run();
      },
    },
  ],
  extensions: [extensionEntry(Column), extensionEntry(Columns)],
});
