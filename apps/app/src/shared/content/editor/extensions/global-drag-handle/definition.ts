import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";

import GlobalDragHandle from ".";

export const globalDragHandleDefinition = new RuntimeExtensionDefinition({
  name: "global-drag-handle",
  ownerPath: "global-drag-handle",
  placement: { phase: "before-schema", anchor: "code" },
  create: () => [GlobalDragHandle],
});
