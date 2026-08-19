import { Editor } from "@tiptap/core";
import * as Y from "yjs";

import extensionsList from "../src/shared/content/editor/extensions";
import { getAiToolkit } from "../src/shared/content/editor/html-schema/toolkit";

export function getEditorSchema(): string {
  const ydoc = new Y.Doc();
  const editor = new Editor({
    extensions: extensionsList({
      mode: "collaborative",
      charLimit: 0,
      blockLimit: 0,
      userName: "Server",
      mediaUploads: "enabled",
      collaboration: {
        ydoc,
        provider: null,
        disableCursors: true,
      },
    }),
  });
  const toolkit = getAiToolkit(editor);
  const schema = toolkit.getHtmlSchemaAwareness();
  editor.destroy();
  ydoc.destroy();
  return schema;
}
