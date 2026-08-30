import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";

import { getSchema } from "@tiptap/core";
import { JSDOM } from "jsdom";

import "server-only";
import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";
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
let parser: ReturnType<typeof createDomParser> | undefined;

function createDomParser() {
  const { DOMParser } = new JSDOM("").window;
  return new DOMParser();
}

function domParser() {
  parser ??= createDomParser();
  return parser;
}

/**
 * The editor's schema without a browser. Node views are the only client-only
 * half of a block definition and they contribute no nodes or marks, so what the
 * server parses with is what the editor renders with — `scene-html.test.ts`
 * holds that claim.
 */
export function sceneSchema(): Schema {
  schema ??= getSchema(editorSchemaRegistry.materializeSchemaExtensions({}));
  return schema;
}

/**
 * Validates agent-authored HTML the way the editor would and returns the
 * ProseMirror node to write. Throws rather than returning a partial document —
 * nothing may touch the author document until this has passed.
 *
 * `existing` is the document the content is being appended to, so the size
 * limits count the result rather than just the new part; omit it when the
 * content replaces the document.
 */
export function parseSceneHtml(
  html: string,
  existing?: ProseMirrorNode,
): ProseMirrorNode {
  // jsdom rather than a global `DOMParser`: this runs in the Node server, and
  // building the parser explicitly keeps it independent of whether some other
  // module happened to install DOM globals.
  const parsed = parseEditorHtml(sceneSchema(), html, domParser());
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
