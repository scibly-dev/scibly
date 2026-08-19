import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

import ApplySelectionColorPlugin from ".";

export const applySelectionColorDefinition = new RuntimeExtensionDefinition({
  name: "apply-selection-color",
  ownerPath: "apply-selection-color",
  placement: { phase: "end" },
  create: () => [ApplySelectionColorPlugin],
});
