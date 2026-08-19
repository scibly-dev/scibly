import FileHandler from "@tiptap/extension-file-handler";

import { allowedMimeTypes } from "@/lib/file/media-limits";
import { RuntimeExtensionDefinition } from "@/shared/content/editor/extensions/registry/runtime-extension-definition";
import { createEditorFileUploadService } from "@/shared/content/editor/media/editor-file-uploads";

export const fileHandlerDefinition = new RuntimeExtensionDefinition({
  name: "file-handler",
  ownerPath: "file-handler",
  placement: { phase: "before-schema", anchor: "flashcard" },
  create: ({ mediaUploads }) => {
    const uploads = createEditorFileUploadService(mediaUploads);
    if (uploads.mode !== "enabled") return [];

    return [
      FileHandler.configure({
        allowedMimeTypes,
        onDrop: (editor, files, pos) => {
          void uploads.drop(editor, files, pos);
        },
        onPaste: (editor, files, html) => {
          void uploads.paste(editor, files, html);
        },
      }),
    ];
  },
});
