import type { MouseCoords } from "@/shared/content/editor/extensions/global-drag-handle/types";

let lastMouseCoords: MouseCoords | null = null;

export function setLastMouseCoords(coords: MouseCoords | null) {
  lastMouseCoords = coords;
}

export function getLastMouseCoords(): MouseCoords | null {
  return lastMouseCoords;
}
