import Typography from "@tiptap/extension-typography";

import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

export const typographyDefinition = new RuntimeExtensionDefinition({
  name: "typography",
  ownerPath: "typography",
  placement: { phase: "before-schema", anchor: "code" },
  create: () => [Typography],
});
