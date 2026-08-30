import type { Schema } from "@tiptap/pm/model";
import type { Plugin } from "@tiptap/pm/state";
import type { AuthorDocumentEditor } from "@/shared/content/editor/documents/author-document-editor";

import { createClozeSyncPlugin } from "@/shared/content/editor/blocks/questions/cloze-text/plugins/cloze-sync-plugin";
import { createStepsSyncPlugin } from "@/shared/content/editor/blocks/steps/plugins/steps-sync-plugin";

/** Hand-listed rather than harvested from the block registry because TipTap
 * only assembles plugins through an `Editor`, which needs a DOM;
 * `author-normalization.test.ts` holds this list against a real editor's. */
export function authorNormalizationPlugins(schema: Schema): Plugin[] {
  const editor: AuthorDocumentEditor = { isEditable: true, schema };
  return [createStepsSyncPlugin(editor), createClozeSyncPlugin(editor)];
}
