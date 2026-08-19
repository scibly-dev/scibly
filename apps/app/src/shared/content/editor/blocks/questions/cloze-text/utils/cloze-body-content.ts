import type { Editor } from "@tiptap/core";
import type { ResolvedPos } from "@tiptap/pm/model";

import { CLOZE_GAP_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/cloze-gap/schema";
import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";

export const CLOZE_TEXT_CONTENT = "paragraph+";

export function isInsideClozeTextNode(
  $pos: ResolvedPos | null | undefined,
): boolean {
  if (!$pos) return false;
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if ($pos.node(depth).type.name === CLOZE_TEXT_NODE_NAME) {
      return true;
    }
  }
  return false;
}

export function isClozeNestedDragTarget(nodeTypeName: string): boolean {
  return nodeTypeName === "paragraph" || nodeTypeName === CLOZE_GAP_NODE_NAME;
}

export function isInsideClozeAuthorContent(element: Element): boolean {
  return element.closest(".cloze-author-content") != null;
}

function isInsideClozeTextBlock(editor: Editor): boolean {
  return editor.isActive(CLOZE_TEXT_NODE_NAME);
}

export function shouldHideSlashCommandInClozeContext(
  editor: Editor,
  _commandName: string,
): boolean {
  return isInsideClozeTextBlock(editor);
}
