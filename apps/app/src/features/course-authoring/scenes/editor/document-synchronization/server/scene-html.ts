import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";

import { getSchema } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { JSDOM } from "jsdom";

import "server-only";
import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";
import { authorNormalizationPlugins } from "@/shared/content/editor/documents/author-normalization";
import {
  editorLimitError,
  parseEditorHtml,
} from "@/shared/content/editor/documents/validate-editor-html";
import {
  countBlocks,
  countCharacters,
} from "@/shared/content/editor/extensions/editor-count";
import {
  EDITOR_BLOCK_LIMIT,
  EDITOR_CHAR_LIMIT,
} from "@/shared/content/editor/runtime/editor-limits";

/** Raised for HTML the editor schema would not accept. Never a bug report — it
 * is the message the calling agent gets back. */
export class SceneHtmlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SceneHtmlError";
  }
}

let schema: Schema | undefined;
let dom: JSDOM | undefined;
let parser: DOMParser | undefined;

/** One jsdom window for the process: building one costs more than a scene write. */
function domWindow() {
  dom ??= new JSDOM("");
  return dom.window;
}

/** The editor's schema without a browser: node views are the only client-only
 * half of a block definition and contribute no nodes or marks —
 * `scene-html.test.ts` holds that claim. */
export function sceneSchema(): Schema {
  schema ??= getSchema(editorSchemaRegistry.materializeSchemaExtensions({}));
  return schema;
}

/** Throws rather than returning a partial document; pass `existing` when
 * appending so the size limits count the result, not just the new part. */
export function parseSceneHtml(
  html: string,
  existing?: ProseMirrorNode,
): ProseMirrorNode {
  // jsdom rather than a global `DOMParser`, so the Node server stays
  // independent of whether another module installed DOM globals.
  parser ??= new (domWindow().DOMParser)();
  const parsed = parseEditorHtml(sceneSchema(), html, parser);
  if ("error" in parsed) throw new SceneHtmlError(parsed.error);

  const limit = editorLimitError(
    parsed.node,
    existing
      ? { characters: countCharacters(existing), blocks: countBlocks(existing) }
      : { characters: 0, blocks: 0 },
    { maxCharacters: EDITOR_CHAR_LIMIT, maxBlocks: EDITOR_BLOCK_LIMIT },
  );
  if (limit) throw new SceneHtmlError(limit);

  return parsed.node;
}

/** The other direction: the author document as the HTML an agent can read and
 * hand back to `parseSceneHtml`. */
export function sceneHtml(node: ProseMirrorNode): string {
  const { document } = domWindow();
  const container = document.createElement("div");
  container.appendChild(
    DOMSerializer.fromSchema(sceneSchema()).serializeFragment(node.content, {
      document,
    }),
  );
  return container.innerHTML;
}

/** Runs the author-normalization plugins over the write as the editor would;
 * `previous` is what they read to tell an edit from content that merely
 * arrived, and a bare `EditorState` rather than an `Editor` keeps the server
 * free of the global `window`/`document` an `Editor` needs. */
export function normalizeAuthorDocument(
  previous: ProseMirrorNode,
  next: ProseMirrorNode,
): ProseMirrorNode {
  const state = EditorState.create({
    doc: previous,
    plugins: authorNormalizationPlugins(sceneSchema()),
  });
  const { tr } = state;
  tr.replaceWith(0, previous.content.size, next.content);
  return state.apply(tr).doc;
}
