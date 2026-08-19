import type { Editor } from "@tiptap/core";

import { CUSTOM_PARAGRAPH_NODE_NAME } from "@/shared/content/editor/blocks/custom-paragraph/schema";
import {
  MATCHING_PAIR_SIDE_NODE_NAME,
  MATCHING_PAIRS_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { MATCHING_PAIR_SIDE_MEDIA_GROUP } from "@/shared/content/editor/blocks/registry/content-groups";

const MATCHING_PAIR_SIDE_BLOCK_NODES = [
  CUSTOM_PARAGRAPH_NODE_NAME,
  "blockquote",
  MATCHING_PAIR_SIDE_MEDIA_GROUP,
] as const;

export const MATCHING_PAIR_SIDE_CONTENT = `(${MATCHING_PAIR_SIDE_BLOCK_NODES.join(" | ")})+`;

const MATCHING_PAIR_SIDE_SLASH_COMMANDS = new Set([
  "blockquote",
  "image",
  "audioPlayer",
  "block equation",
  "inline equation",
]);

function isInsideMatchingPairsBlock(editor: Editor): boolean {
  return editor.isActive(MATCHING_PAIRS_NODE_NAME);
}

function isInsideMatchingPairSide(editor: Editor): boolean {
  return editor.isActive(MATCHING_PAIR_SIDE_NODE_NAME);
}

export function shouldHideSlashCommandInMatchingPairsContext(
  editor: Editor,
  commandName: string,
): boolean {
  if (!isInsideMatchingPairsBlock(editor)) return false;
  if (!isInsideMatchingPairSide(editor)) return true;
  return !MATCHING_PAIR_SIDE_SLASH_COMMANDS.has(commandName);
}
