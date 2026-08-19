import { Document as TiptapDocument } from "@tiptap/extension-document";

import { extensionEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { FrameworkSchemaDefinition } from "@/shared/content/editor/blocks/registry/types";

export const documentDefinition = new FrameworkSchemaDefinition({
  name: TiptapDocument.name,
  ownerPath: "document",
  slot: "text",
  createExtensions: ({ documentContentExpression }) => [
    extensionEntry(
      TiptapDocument.extend({
        content: documentContentExpression,
        addHtmlSchemaAwareness() {
          return {
            tag: "div",
            name: "Document",
            description:
              "The root node of the document which MUST wrap the whole content. Contains one or more block or column nodes.",
          };
        },
      }),
    ),
  ],
});
