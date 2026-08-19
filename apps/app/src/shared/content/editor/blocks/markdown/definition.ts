import { Markdown } from "@tiptap/markdown";

import { extensionEntry } from "@/shared/content/editor/blocks/registry/definition-helpers";
import { FrameworkSchemaDefinition } from "@/shared/content/editor/blocks/registry/types";

export const markdownDefinition = new FrameworkSchemaDefinition({
  name: Markdown.name,
  ownerPath: "markdown",
  slot: "text",
  extensions: [
    extensionEntry(
      Markdown.configure({
        markedOptions: {
          gfm: true,
          breaks: false,
          pedantic: false,
        },
      }),
    ),
  ],
});
