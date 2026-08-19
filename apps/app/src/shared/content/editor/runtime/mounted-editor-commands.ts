import type { Editor } from "@tiptap/core";
import type { MountedEditorCommands } from "@/shared/content/editor/runtime/editor-contract";

import { insertMediaNodeAtEnd } from "@/shared/content/editor/media/utils/media";

export function createMountedEditorCommands(
  editor: Editor | null,
): MountedEditorCommands {
  return {
    insertImage: ({ url, alt }) => {
      if (!editor || editor.isDestroyed) return false;
      insertMediaNodeAtEnd(editor, url, alt);
      editor
        .chain()
        .insertContentAt(editor.state.doc.content.size, {
          type: "paragraph",
        })
        .focus("end")
        .run();
      return true;
    },
  };
}
