import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import type { EditorCountStorage } from "@/shared/content/editor/extensions/editor-count";

import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { z } from "zod";

import { stripLearnerStateFromQuestionBlocks } from "@/shared/content/client";

interface GetSceneContentArgs {
  editor: Editor | null;
  activeSceneId: string | undefined;
}

export function executeGetSceneContent({
  editor,
  activeSceneId,
}: GetSceneContentArgs) {
  const html = editor?.getHTML() ?? "";
  return { html, sceneId: activeSceneId };
}

interface InsertContentArgs {
  editor: Editor | null;
  toolCall: {
    input?: unknown;
  };
}

type EditorContentResult =
  | { success: true; html: string }
  | { success: false; error: string; html: string };

type WriteMode = "replace" | "append";

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const insertContentInputSchema = z.object({ html: z.string() });

function prepareInsertHtml(html: string) {
  try {
    return {
      html: stripLearnerStateFromQuestionBlocks(html),
      error: undefined,
    };
  } catch (stripError: unknown) {
    return { html, error: message(stripError) };
  }
}

function knownDataTypes(editor: Editor): Set<string> {
  const types = new Set<string>();
  const specs = [
    ...Object.values(editor.schema.nodes),
    ...Object.values(editor.schema.marks),
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

// ProseMirror's DOM parser silently drops unrecognized blocks instead of throwing, so this checks explicitly.
function unknownBlockTypes(editor: Editor, body: HTMLElement): string[] {
  const known = knownDataTypes(editor);
  const found = new Set<string>();
  for (const element of body.querySelectorAll("[data-type]")) {
    const dataType = element.getAttribute("data-type");
    if (dataType && !known.has(dataType)) found.add(dataType);
  }
  return [...found];
}

type ParsedHtml = { node: ProseMirrorNode } | { error: string };

function parseHtml(editor: Editor, html: string): ParsedHtml {
  if (typeof DOMParser === "undefined") {
    return {
      error:
        "Scene content cannot be validated in this environment, so the write was refused rather than applied unchecked.",
    };
  }

  let body: HTMLElement;
  try {
    body = new DOMParser().parseFromString(html, "text/html").body;
  } catch (error: unknown) {
    return { error: `HTML could not be parsed: ${message(error)}` };
  }

  const unknown = unknownBlockTypes(editor, body);
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
    node = ProseMirrorDOMParser.fromSchema(editor.schema).parse(body);
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

// `filterTransaction` also enforces these limits but fails silently, so this makes it a reportable error.
function limitError(
  editor: Editor,
  node: ProseMirrorNode,
  mode: WriteMode,
): string | null {
  const counts: EditorCountStorage | undefined = editor.storage.editorCount;
  if (!counts) return null;

  const characters =
    (mode === "append" ? counts.characters() : 0) + counts.characters({ node });
  const blocks =
    (mode === "append" ? counts.blocks() : 0) + counts.blocks({ node });

  if (counts.maxCharacters > 0 && characters > counts.maxCharacters) {
    return `This would leave the scene at ${characters} characters; the limit is ${counts.maxCharacters}. Split the content across more scenes.`;
  }
  if (counts.maxBlocks > 0 && blocks > counts.maxBlocks) {
    return `This would leave the scene at ${blocks} blocks; the limit is ${counts.maxBlocks}. Split the content across more scenes.`;
  }
  return null;
}

function contentError(
  editor: Editor,
  html: string,
  { allowEmpty, mode }: { allowEmpty: boolean; mode: WriteMode },
): Extract<EditorContentResult, { success: false }> | null {
  if (!html) {
    return allowEmpty
      ? null
      : { success: false, error: "HTML content is empty or missing.", html };
  }

  const parsed = parseHtml(editor, html);
  if ("error" in parsed) {
    return { success: false, error: parsed.error, html };
  }

  const limit = limitError(editor, parsed.node, mode);
  return limit ? { success: false, error: limit, html } : null;
}

function executeContent(
  { editor, toolCall }: InsertContentArgs,
  options: {
    allowEmpty: boolean;
    mode: WriteMode;
    apply: (editor: Editor, html: string) => void;
  },
): EditorContentResult {
  const parsedInput = insertContentInputSchema.safeParse(toolCall.input);
  const prepared = prepareInsertHtml(
    parsedInput.success ? parsedInput.data.html : "",
  );
  const html = prepared.html;
  if (prepared.error) return { success: false, error: prepared.error, html };
  if (!editor) {
    return {
      success: false,
      error: "Editor is not active or available.",
      html,
    };
  }
  const error = contentError(editor, html, options);
  if (error) return error;

  try {
    options.apply(editor, html);
    return { success: true, html };
  } catch (editorError: unknown) {
    return {
      success: false,
      error: `Editor failed to render the HTML content: ${message(editorError)}`,
      html,
    };
  }
}

export function executeInsertContent(
  args: InsertContentArgs,
): EditorContentResult {
  return executeContent(args, {
    allowEmpty: true,
    mode: "replace",
    apply: (editor, html) => {
      editor.commands.setContent(html);
    },
  });
}

export function executeAppendContent(
  args: InsertContentArgs,
): EditorContentResult {
  return executeContent(args, {
    allowEmpty: false,
    mode: "append",
    apply: (editor, html) => {
      editor.chain().focus("end").insertContent(html).run();
    },
  });
}
