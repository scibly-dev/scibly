"use client";

export {
  executeAppendContent,
  executeGetSceneContent,
  executeInsertContent,
} from "./scenes/editor/ai-insertion/editor-commands";
export {
  default as AuthoringEditor,
  type EditorProps,
  type MountedEditorCommands,
} from "./scenes/editor/authoring-editor";
export {
  performBackgroundAppendContent,
  performBackgroundInsertion,
  performBackgroundInsertMediaNode,
  performBackgroundRead,
} from "./scenes/editor/document-synchronization/background-collaboration";
