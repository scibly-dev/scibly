import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

import EditorCount from ".";

export const editorCountDefinition = new RuntimeExtensionDefinition({
  name: "editor-count",
  ownerPath: "editor-count",
  placement: { phase: "end" },
  create: ({ blockLimit, charLimit }) => [
    EditorCount.configure({
      blockLimit,
      charLimit,
    }),
  ],
});
