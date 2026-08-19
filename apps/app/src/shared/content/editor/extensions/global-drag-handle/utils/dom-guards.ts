import { isInsideClozeAuthorContent } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-body-content";
import { getLastMouseCoords } from "@/shared/content/editor/extensions/global-drag-handle/state/mouse-coords";
import { isGuideSpeechInteractiveBlock } from "@/shared/content/editor/extensions/global-drag-handle/utils/guide-speech-target";

function getElementsAtPoint(coords: { x: number; y: number }) {
  return document
    .elementsFromPoint(coords.x, coords.y)
    .filter((element): element is Element => element instanceof Element);
}

export function isInsideGuideSpeechContent(element: Element): boolean {
  return element.closest(".guide-speech-content") != null;
}

export function isOnStepsChrome(coords: { x: number; y: number }) {
  const elements = getElementsAtPoint(coords);
  return (
    elements.some((element) => element.closest(".steps")) &&
    !elements.some((element) => element.closest(".steps-item__card"))
  );
}

export function isInsideGuideDragZone(coords: { x: number; y: number }) {
  return getElementsAtPoint(coords).some((element) =>
    element.closest("[data-guide-drag-zone]"),
  );
}

function isInsideGuideSettingsChrome(coords: { x: number; y: number }) {
  return getElementsAtPoint(coords).some((element) =>
    element.closest("[data-guide-settings-chrome]"),
  );
}

export function isInsideGuideSpeech(coords: { x: number; y: number }) {
  return getElementsAtPoint(coords).some((element) =>
    isInsideGuideSpeechContent(element),
  );
}

export function shouldHideDragHandleAtCursor(): boolean {
  const coords = getLastMouseCoords();
  if (!coords) return false;

  if (isInsideGuideSettingsChrome(coords)) {
    return true;
  }

  const elements = getElementsAtPoint(coords);

  if (elements.some((element) => isInsideClozeAuthorContent(element))) {
    return true;
  }

  if (elements.some((element) => isGuideSpeechInteractiveBlock(element))) {
    return false;
  }

  for (const element of elements) {
    const blockedByNotDraggable = element.closest(".not-draggable");
    if (!blockedByNotDraggable) continue;

    if (isInsideGuideSpeechContent(blockedByNotDraggable)) {
      continue;
    }

    return true;
  }

  return false;
}
