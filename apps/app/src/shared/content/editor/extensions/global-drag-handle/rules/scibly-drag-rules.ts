import type { DragHandleRule } from "@tiptap/extension-drag-handle";

import { CUSTOM_COLUMN_NODE_NAME } from "@/shared/content/editor/blocks/column/schema";
import { CUSTOM_FLASHCARD_NODE_NAME } from "@/shared/content/editor/blocks/flashcard/schema";
import { GUIDE_CHARACTER_NODE_NAME } from "@/shared/content/editor/blocks/guide-character/schema";
import { CLOZE_TEXT_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import {
  isClozeNestedDragTarget,
  isInsideClozeTextNode,
} from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-body-content";
import {
  STEP_NODE_NAME,
  STEPS_NODE_NAME,
} from "@/shared/content/editor/blocks/steps/schema";
import { getLastMouseCoords } from "@/shared/content/editor/extensions/global-drag-handle/state/mouse-coords";
import {
  isInsideGuideDragZone,
  isInsideGuideSpeech,
  isOnStepsChrome,
} from "@/shared/content/editor/extensions/global-drag-handle/utils/dom-guards";
import {
  isSameGuideSpeechDragTarget,
  resolveGuideSpeechDragTargetPos,
} from "@/shared/content/editor/extensions/global-drag-handle/utils/guide-speech-target";

type AncestorAware = {
  depth: number;
  node: (depth: number) => { type: { name: string } };
};

function hasAncestorOfType($pos: AncestorAware, typeName: string): boolean {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if ($pos.node(depth).type.name === typeName) {
      return true;
    }
  }
  return false;
}

function isInsideGuideCharacter($pos: AncestorAware): boolean {
  return hasAncestorOfType($pos, GUIDE_CHARACTER_NODE_NAME);
}

const LIST_LIKE_NODES = new Set([
  "listItem",
  "orderedList",
  "bulletList",
  "paragraph",
]);

const VERTICAL_ALIGN_BLOCK_TYPES = new Set([
  ...LIST_LIKE_NODES,
  CUSTOM_FLASHCARD_NODE_NAME,
  CUSTOM_COLUMN_NODE_NAME,
  "heading",
  "blockquote",
  "codeBlock",
]);

function shouldApplyVerticalAlignment(node: {
  isBlock: boolean;
  isAtom: boolean;
  type: { name: string };
}): boolean {
  if (VERTICAL_ALIGN_BLOCK_TYPES.has(node.type.name)) {
    return true;
  }

  return node.isBlock && node.isAtom && node.type.name.startsWith("custom-");
}

function isVerticallyAlignedWithCursor(
  view: { nodeDOM: (pos: number) => Node | null },
  pos: number,
  coords: { x: number; y: number },
): boolean | null {
  const dom = view.nodeDOM(pos);
  if (!(dom instanceof Element)) {
    return null;
  }

  const rect = dom.getBoundingClientRect();
  if (rect.height <= 0) {
    return null;
  }

  return coords.y >= rect.top - 12 && coords.y <= rect.bottom + 12;
}

export const sciblyDragRules: DragHandleRule[] = [
  {
    id: "preferVerticallyAlignedTarget",
    evaluate: ({ node, view, pos, $pos }) => {
      const coords = getLastMouseCoords();
      if (!coords || !shouldApplyVerticalAlignment(node)) {
        return 0;
      }

      if (
        isInsideClozeTextNode($pos) &&
        isClozeNestedDragTarget(node.type.name)
      ) {
        return 0;
      }

      const aligned = isVerticallyAlignedWithCursor(view, pos, coords);
      if (aligned == null) {
        return 0;
      }

      return aligned ? -450 : 250;
    },
  },
  {
    id: "preferCustomAtomBlocks",
    evaluate: ({ node }) => {
      if (node.isAtom && node.isBlock && node.type.name.startsWith("custom-")) {
        return -600;
      }

      return 0;
    },
  },
  {
    id: "preferDeeperListTargets",
    evaluate: ({ node, depth, $pos }) => {
      if (!LIST_LIKE_NODES.has(node.type.name)) {
        return 0;
      }

      if (isInsideClozeTextNode($pos)) {
        return 0;
      }

      return -(depth * 75);
    },
  },
  {
    id: "preferClozeTextBlock",
    evaluate: ({ node, $pos }) => {
      if (!isInsideClozeTextNode($pos)) {
        return 0;
      }

      if (node.type.name === CLOZE_TEXT_NODE_NAME) {
        return -1200;
      }

      if (isClozeNestedDragTarget(node.type.name)) {
        return 1200;
      }

      return 0;
    },
  },
  {
    id: "preferGuideSpeechBlockUnderCursor",
    evaluate: ({ node, view, pos, $pos }) => {
      const coords = getLastMouseCoords();
      if (!coords || !isInsideGuideSpeech(coords)) return 0;

      if (node.type.name === GUIDE_CHARACTER_NODE_NAME) {
        return 0;
      }

      if (!isInsideGuideCharacter($pos)) {
        return 0;
      }

      const targetPos = resolveGuideSpeechDragTargetPos(view, coords);
      if (targetPos == null) {
        return 0;
      }

      if (isSameGuideSpeechDragTarget(view, pos, node, targetPos)) {
        return -900;
      }

      return 700;
    },
  },
  {
    id: "preferGuideSpeechBlocks",
    evaluate: ({ node, $pos }) => {
      const coords = getLastMouseCoords();
      if (!coords || !isInsideGuideSpeech(coords)) return 0;

      if (node.type.name === GUIDE_CHARACTER_NODE_NAME) {
        return 900;
      }

      if (isInsideGuideCharacter($pos)) {
        return -500;
      }

      return 0;
    },
  },
  {
    id: "preferGuideRootInDragZone",
    evaluate: ({ node }) => {
      const coords = getLastMouseCoords();
      if (!coords) return 0;

      const inDragZone = isInsideGuideDragZone(coords);
      const inSpeech = isInsideGuideSpeech(coords);

      if (inDragZone && !inSpeech) {
        if (node.type.name === GUIDE_CHARACTER_NODE_NAME) return -500;
        return 200;
      }

      return 0;
    },
  },
  {
    id: "deprioritizeColumnWrapper",
    evaluate: ({ node }) => {
      if (node.type.name === CUSTOM_COLUMN_NODE_NAME) {
        return 900;
      }
      return 0;
    },
  },
  {
    id: "preferFlashcardBlock",
    evaluate: ({ node, parent }) => {
      if (node.type.name === CUSTOM_FLASHCARD_NODE_NAME) {
        return -200;
      }

      if (parent?.type.name === CUSTOM_FLASHCARD_NODE_NAME) {
        return 800;
      }

      return 0;
    },
  },
  {
    id: "preferStepsTarget",
    evaluate: ({ node, $pos }) => {
      const isBlock = node.type.name === STEPS_NODE_NAME;
      if (!isBlock && !hasAncestorOfType($pos, STEPS_NODE_NAME)) {
        return 0;
      }

      if (node.type.name === STEP_NODE_NAME) return 1200;

      const coords = getLastMouseCoords();
      const onChrome = coords != null && isOnStepsChrome(coords);
      if (isBlock) return onChrome ? -1200 : 900;
      return onChrome ? 900 : -1200;
    },
  },
  {
    id: "excludeTableRowTarget",
    evaluate: ({ node }) => {
      if (node.type.name === "tableRow") {
        return 1000;
      }
      return 0;
    },
  },
];
