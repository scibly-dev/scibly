import UniqueID from "@tiptap/extension-unique-id";

import { extensionEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { FrameworkSchemaDefinition } from "@/shared/content/editor/blocks/registry/types";

export const stableIdDefinition = new FrameworkSchemaDefinition({
  name: UniqueID.name,
  ownerPath: "stable-id",
  slot: "text",
  createExtensions: ({ stableIdNodeNames }) => [
    extensionEntry(
      UniqueID.configure({
        types: [...stableIdNodeNames],
      }),
    ),
  ],
});
