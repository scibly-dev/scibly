import type { Editor } from "@tiptap/core";

import {
  handleEditorFileDrop,
  handleEditorFilePaste,
} from "@/shared/content/editor/media/utils/media";

type EditorFileUploadHandlers = {
  drop: (editor: Editor, files: File[], position: number) => Promise<void>;
  paste: (
    editor: Editor,
    files: File[],
    pastedHtmlContent: string | undefined,
  ) => Promise<void>;
};

type EditorFileUploadService = {
  mode: "enabled" | "disabled";
  drop: (editor: Editor, files: File[], position: number) => Promise<boolean>;
  paste: (
    editor: Editor,
    files: File[],
    pastedHtmlContent: string | undefined,
  ) => Promise<boolean>;
};

const defaultHandlers: EditorFileUploadHandlers = {
  drop: handleEditorFileDrop,
  paste: handleEditorFilePaste,
};

export function createEditorFileUploadService(
  capability: "enabled" | "disabled",
  handlers: EditorFileUploadHandlers = defaultHandlers,
): EditorFileUploadService {
  if (capability === "disabled") {
    return {
      mode: "disabled",
      drop: async () => false,
      paste: async () => false,
    };
  }

  return {
    mode: "enabled",
    drop: async (editor, files, position) => {
      await handlers.drop(editor, files, position);
      return true;
    },
    paste: async (editor, files, pastedHtmlContent) => {
      await handlers.paste(editor, files, pastedHtmlContent);
      return true;
    },
  };
}
