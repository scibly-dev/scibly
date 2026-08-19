import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Extension, Mark, Node } from "@tiptap/core";
import type * as Y from "yjs";

export type SharedExtensionConfig = {
  blockLimit: number;
  charLimit: number;
  mediaUploads: "disabled" | "enabled";
  userName: string;
};

export type ExtensionConfig =
  | (SharedExtensionConfig & {
      collaboration?: never;
      mode: "local";
    })
  | (SharedExtensionConfig & {
      collaboration: {
        disableCursors?: boolean;
        provider: HocuspocusProvider | null;
        ydoc: Y.Doc;
      };
      mode: "collaborative";
    });

export type ExtensionArray = (Extension | Mark | Node)[];
