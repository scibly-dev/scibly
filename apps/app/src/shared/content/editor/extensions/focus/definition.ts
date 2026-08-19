import Focus from "@tiptap/extension-focus";

import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

export const focusDefinition = new RuntimeExtensionDefinition({
  name: "focus",
  ownerPath: "focus",
  placement: { phase: "before-schema", anchor: "fontFamily" },
  create: () => [
    Focus.configure({
      className: "has-focus",
      mode: "all",
    }),
  ],
});
