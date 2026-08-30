import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import type { EditorCountStorage } from "@/shared/content/editor/extensions/editor-count";

import { z } from "zod";

import {
  editorLimitError,
  parseEditorHtml,
} from "@/shared/content/editor/documents/validate-editor-html";

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

function limitError(
  editor: Editor,
  node: ProseMirrorNode,
  mode: WriteMode,
): string | null {
  const counts: EditorCountStorage | undefined = editor.storage.editorCount;
  if (!counts) return null;

  return editorLimitError(
    node,
    mode === "append"
      ? { characters: counts.characters(), blocks: counts.blocks() }
      : { characters: 0, blocks: 0 },
    { maxCharacters: counts.maxCharacters, maxBlocks: counts.maxBlocks },
  );
}

function applied(
  editor: Editor,
  html: string,
  options: { apply: (editor: Editor, html: string) => void },
): EditorContentResult {
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

function executeContent(
  { editor, toolCall }: InsertContentArgs,
  options: {
    allowEmpty: boolean;
    mode: WriteMode;
    apply: (editor: Editor, html: string) => void;
  },
): EditorContentResult {
  const parsedInput = insertContentInputSchema.safeParse(toolCall.input);
  const html = parsedInput.success ? parsedInput.data.html : "";

  if (!editor) {
    return { success: false, error: "Editor is not active or available.", html };
  }
  if (!html) {
    return options.allowEmpty
      ? applied(editor, html, options)
      : { success: false, error: "HTML content is empty or missing.", html };
  }
  if (typeof DOMParser === "undefined") {
    return {
      success: false,
      error:
        "Scene content cannot be validated in this environment, so the write was refused rather than applied unchecked.",
      html,
    };
  }

  const parsed = parseEditorHtml(editor.schema, html, new DOMParser());
  if ("error" in parsed) {
    return { success: false, error: parsed.error, html };
  }

  const limit = limitError(editor, parsed.node, options.mode);
  if (limit) return { success: false, error: limit, html: parsed.html };

  return applied(editor, parsed.html, options);
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
