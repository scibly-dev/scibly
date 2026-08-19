import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { CUSTOM_GROUP_BLOCK_NODE_NAME } from "./schema";

export const customGroupDefinition = new BlockDefinition({
  name: CUSTOM_GROUP_BLOCK_NODE_NAME,
  ownerPath: "ui/react-block-wrapper",
  slot: "content",
  stableId: true,
  stableIdOrder: 70,
  extensions: [],
});
