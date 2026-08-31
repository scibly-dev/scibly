import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";

import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";

import { stripLearnerStateFromQuestionBlocks } from "@/shared/content/editor/assessment/learner/learner-state";
import {
  countBlocks,
  countCharacters,
} from "@/shared/content/editor/extensions/editor-count";

// The `DOMParser` is passed in rather than taken from a global because the
// Node server has none — callers supply jsdom's.

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function knownDataTypes(schema: Schema): Set<string> {
  const types = new Set<string>();
  const specs = [
    ...Object.values(schema.nodes),
    ...Object.values(schema.marks),
  ];
  for (const { spec } of specs) {
    for (const rule of spec.parseDOM ?? []) {
      const tag = "tag" in rule && typeof rule.tag === "string" ? rule.tag : "";
      const dataType = /data-type=["']([^"']+)["']/.exec(tag)?.[1];
      if (dataType) types.add(dataType);
    }
  }
  return types;
}

// ProseMirror's DOM parser silently turns an unrecognized block into a plain
// paragraph that passes `Node.check()`, so unknown types must be refused here.
function unknownBlockTypes(schema: Schema, body: HTMLElement): string[] {
  const known = knownDataTypes(schema);
  const found = new Set<string>();
  for (const element of body.querySelectorAll("[data-type]")) {
    const dataType = element.getAttribute("data-type");
    if (dataType && !known.has(dataType)) found.add(dataType);
  }
  return [...found];
}

export function parseEditorHtml(
  schema: Schema,
  html: string,
  dom: Pick<DOMParser, "parseFromString">,
): { node: ProseMirrorNode } | { error: string } {
  let body: HTMLElement;
  try {
    body = dom.parseFromString(html, "text/html").body;
  } catch (error: unknown) {
    return { error: `HTML could not be parsed: ${message(error)}` };
  }

  // On the parsed document, so the strip cannot reach text that merely looks
  // like the attribute, and quoting is the parser's problem rather than ours.
  try {
    stripLearnerStateFromQuestionBlocks(body);
  } catch (error: unknown) {
    return { error: message(error) };
  }

  const unknown = unknownBlockTypes(schema, body);
  if (unknown.length > 0) {
    return {
      error:
        `Unknown block type(s): ${unknown.join(", ")}. The editor schema has no such block, ` +
        "so it would be dropped and its contents flattened into plain text. " +
        "Call getEditorSchema and use an exact data-type.",
    };
  }

  let node: ProseMirrorNode;
  try {
    node = ProseMirrorDOMParser.fromSchema(schema).parse(body);
  } catch (error: unknown) {
    return {
      error: `HTML / JSON validation failed: ${message(error)}. Ensure your HTML structure is correct, custom node tags are valid, and all JSON block attributes (like questionblock-data or data-media-attributes) have valid, properly escaped JSON structures.`,
    };
  }

  const survivingText = node.textBetween(0, node.content.size, " ").trim();
  if (!survivingText && (body.textContent ?? "").trim()) {
    return {
      error:
        "None of the content survived parsing into the editor schema — the scene would end up empty. " +
        "Check the HTML against getEditorSchema.",
    };
  }

  return { node };
}

// The editor's `filterTransaction` enforces these limits silently
// (`insertContent` returns `true`, nothing lands), so the writer asks here
// instead to get an error the agent can act on.
export function editorLimitError(
  node: ProseMirrorNode,
  existing: { characters: number; blocks: number },
  limits: { maxCharacters: number; maxBlocks: number },
): string | null {
  const characters = existing.characters + countCharacters(node);
  const blocks = existing.blocks + countBlocks(node);

  if (limits.maxCharacters > 0 && characters > limits.maxCharacters) {
    return `This would leave the scene at ${characters} characters; the limit is ${limits.maxCharacters}. Split the content across more scenes.`;
  }
  if (limits.maxBlocks > 0 && blocks > limits.maxBlocks) {
    return `This would leave the scene at ${blocks} blocks; the limit is ${limits.maxBlocks}. Split the content across more scenes.`;
  }
  return null;
}
