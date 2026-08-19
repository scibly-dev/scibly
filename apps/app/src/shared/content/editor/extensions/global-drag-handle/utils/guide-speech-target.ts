import type { Node as PMNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

import { NodeSelection } from "@tiptap/pm/state";

import { GUIDE_CHARACTER_NODE_NAME } from "@/shared/content/editor/blocks/guide-character/schema";
import { isInsideGuideSpeechContent } from "@/shared/content/editor/extensions/global-drag-handle/utils/dom-guards";

const GUIDE_SPEECH_BLOCK_SELECTOR = [
  ".react-renderer",
  "li",
  "ol",
  "ul",
  "blockquote",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
].join(", ");

function getGuideSpeechContentRoot(speech: Element): Element {
  return speech.querySelector(".ProseMirror") ?? speech;
}

function findGuideSpeechBlockElementAtCoords(coords: {
  x: number;
  y: number;
}): Element | null {
  for (const element of document.elementsFromPoint(coords.x, coords.y)) {
    if (!(element instanceof Element)) continue;

    const speech = element.closest(".guide-speech-content");
    if (!speech) continue;

    const block = element.closest(GUIDE_SPEECH_BLOCK_SELECTOR);
    if (!(block instanceof Element) || !speech.contains(block)) continue;

    const contentRoot = getGuideSpeechContentRoot(speech);
    if (contentRoot.contains(block)) {
      return block;
    }
  }

  return null;
}

function findGuideSpeechBlockPosAtCoords(
  view: EditorView,
  coords: { x: number; y: number },
): number | null {
  const block = findGuideSpeechBlockElementAtCoords(coords);
  if (!block) return null;

  try {
    const pos = view.posAtDOM(block, 0);
    return view.state.doc.nodeAt(pos) ? pos : null;
  } catch {
    return null;
  }
}

export function resolveGuideSpeechDragTargetPos(
  view: EditorView,
  coords: { x: number; y: number },
): number | null {
  const rawPos = findGuideSpeechBlockPosAtCoords(view, coords);
  if (rawPos == null) return null;

  const $pos = view.state.doc.resolve(rawPos);
  let guideDepth: number | null = null;

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if ($pos.node(depth).type.name === GUIDE_CHARACTER_NODE_NAME) {
      guideDepth = depth;
      break;
    }
  }

  if (guideDepth == null) return null;

  const childDepth = guideDepth + 1;
  if ($pos.depth >= childDepth) {
    return $pos.before(childDepth);
  }

  if ($pos.nodeAfter?.isBlock) {
    return $pos.pos;
  }

  return null;
}

export function isSameGuideSpeechDragTarget(
  view: EditorView,
  candidatePos: number,
  candidateNode: PMNode,
  targetPos: number,
): boolean {
  if (candidatePos === targetPos) return true;

  const targetNode = view.state.doc.nodeAt(targetPos);
  if (targetNode?.eq(candidateNode)) return true;

  try {
    const candidateSelection = NodeSelection.create(
      view.state.doc,
      candidatePos,
    );
    const targetSelection = NodeSelection.create(view.state.doc, targetPos);
    return (
      candidateSelection.node.eq(targetSelection.node) &&
      candidateSelection.from === targetSelection.from
    );
  } catch {
    return false;
  }
}

export function isGuideSpeechInteractiveBlock(element: Element): boolean {
  if (!isInsideGuideSpeechContent(element)) {
    return false;
  }

  const speech = element.closest(".guide-speech-content");
  if (!speech) return false;

  const block = element.closest(GUIDE_SPEECH_BLOCK_SELECTOR);
  if (!(block instanceof Element) || !speech.contains(block)) {
    return false;
  }

  const contentRoot = getGuideSpeechContentRoot(speech);
  return contentRoot.contains(block);
}
