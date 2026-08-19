import type { Content } from "@tiptap/core";
import type { Ref } from "react";
import type { EditorCapabilities } from "@/shared/content/editor/runtime/context/editor-capabilities-context";

export type EditorVariant =
  | { type: "author"; isReadOnly?: boolean }
  | { type: "preview" };

export type MountedEditorCommands = {
  insertImage: (input: { url: string; alt?: string }) => boolean;
};

type SharedEditorProps = {
  variant?: EditorVariant;
  wrapperClassName?: string;
  shouldSetStoreEditor?: boolean;
  capabilities?: EditorCapabilities;
};

export type LocalEditorProps = SharedEditorProps & {
  mode: "local";
  initialContent: Content;
  commandRef?: Ref<MountedEditorCommands>;
  documentId?: never;
};

export type CollaborativeEditorProps = SharedEditorProps & {
  mode?: "collab";
  documentId: string;
  initialContent?: never;
  commandRef?: never;
};

export type EditorBehaviorProps = LocalEditorProps | CollaborativeEditorProps;
