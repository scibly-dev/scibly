import { ListKeymap } from "@tiptap/extension-list";
import { Dropcursor, Gapcursor, TrailingNode } from "@tiptap/extensions";

import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

export const cursorNavigationDefinition = new RuntimeExtensionDefinition({
  name: "cursor-navigation",
  ownerPath: "cursor-navigation",
  placement: { phase: "before-schema", anchor: "superscript" },
  create: () => [
    Dropcursor.configure({ color: "#DBEAFE", width: 5 }),
    Gapcursor,
    ListKeymap,
    TrailingNode,
  ],
});
