import type { Schema } from "@tiptap/pm/model";

/** Narrower than TipTap's `Editor` because the same plugins run headlessly,
 * over a bare `EditorState`, when an agent writes to a scene nobody has open. */
export type AuthorDocumentEditor = {
  isEditable: boolean;
  schema: Schema;
};
