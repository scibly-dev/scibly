import { CUSTOM_FLASHCARD_NODE_NAME } from "@/shared/content/editor/blocks/flashcard/schema";

export const MATCHING_PAIR_SIDE_MEDIA_GROUP = "matchingPairSideMedia";

const NESTABLE_EDITOR_BLOCKS = `(block|${CUSTOM_FLASHCARD_NODE_NAME})` as const;

export const NESTABLE_BLOCK_CONTENT = `${NESTABLE_EDITOR_BLOCKS}+`;
