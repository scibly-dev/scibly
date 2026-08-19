import { UndoRedo } from "@tiptap/extensions";

import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

export const undoRedoDefinition = new RuntimeExtensionDefinition({
  name: "undo-redo",
  ownerPath: "undo-redo",
  placement: { phase: "end" },
  create: ({ mode }) => (mode === "local" ? [UndoRedo] : []),
});
