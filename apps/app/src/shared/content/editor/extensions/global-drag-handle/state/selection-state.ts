let dragHandleSelectionActive = false;

export function markDragHandleSelectionActive() {
  dragHandleSelectionActive = true;
}

export function clearDragHandleSelectionActive() {
  dragHandleSelectionActive = false;
}

export function isDragHandleSelectionActive() {
  return dragHandleSelectionActive;
}
