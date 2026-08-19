import { extensionEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { CustomListItem } from "./index";

export const customListItemDefinition = new BlockDefinition({
  name: CustomListItem.name,
  ownerPath: "custom-list-item",
  slot: "text",
  extensions: [extensionEntry(CustomListItem)],
});
