import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Content } from "@tiptap/core";

import extensions from "@/shared/content/editor/extensions";
import {
  EDITOR_BLOCK_LIMIT,
  EDITOR_CHAR_LIMIT,
} from "@/shared/content/editor/runtime/editor-limits";

type SharedEditorOptionsInput = {
  editable: boolean;
  mediaUploads: "enabled" | "disabled";
  userName: string;
};

export function createLocalEditorOptions({
  editable,
  initialContent,
  mediaUploads,
  userName,
}: SharedEditorOptionsInput & {
  initialContent: Content;
}) {
  return {
    editable,
    extensions: extensions({
      mode: "local",
      charLimit: EDITOR_CHAR_LIMIT,
      blockLimit: EDITOR_BLOCK_LIMIT,
      userName,
      mediaUploads,
    }),
    content: initialContent,
    shouldRerenderOnTransaction: false,
    immediatelyRender: false,

    autofocus: false,
  } as const;
}

export function createCollaborativeEditorOptions({
  disableCursors,
  editable,
  mediaUploads,
  provider,
  userName,
}: SharedEditorOptionsInput & {
  disableCursors?: boolean;
  provider: HocuspocusProvider;
}) {
  return {
    editable,
    extensions: extensions({
      mode: "collaborative",
      charLimit: EDITOR_CHAR_LIMIT,
      blockLimit: EDITOR_BLOCK_LIMIT,
      userName,
      mediaUploads,
      collaboration: {
        ydoc: provider.document,
        provider,
        disableCursors,
      },
    }),
    content: undefined,
    shouldRerenderOnTransaction: false,
    immediatelyRender: false,

    autofocus: true,
  } as const;
}
