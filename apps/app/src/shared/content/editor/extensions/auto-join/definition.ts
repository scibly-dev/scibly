import AutoJoiner from "tiptap-extension-auto-joiner";

import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

export const autoJoinDefinition = new RuntimeExtensionDefinition({
  name: "auto-join",
  ownerPath: "auto-join",
  placement: { phase: "before-schema", anchor: "code" },
  create: () => [AutoJoiner],
});
