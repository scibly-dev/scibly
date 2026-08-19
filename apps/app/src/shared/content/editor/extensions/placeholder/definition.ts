import { Placeholder } from "@tiptap/extensions";

import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

export const placeholderDefinition = new RuntimeExtensionDefinition({
  name: "placeholder",
  ownerPath: "placeholder",
  placement: { phase: "before-schema", anchor: "fontFamily" },
  create: () => [Placeholder.configure({ includeChildren: true })],
});
