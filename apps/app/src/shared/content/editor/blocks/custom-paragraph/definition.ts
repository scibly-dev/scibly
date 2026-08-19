import { extensionEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { BlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { Paragraph } from "./index";

export const paragraphDefinition = new BlockDefinition({
  name: Paragraph.name,
  ownerPath: "custom-paragraph",
  slot: "content",
  extensions: [extensionEntry(Paragraph)],
});
