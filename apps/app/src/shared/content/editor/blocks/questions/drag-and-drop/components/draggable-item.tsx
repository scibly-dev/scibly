import type { QAGradedItemStatus } from "@/shared/content/editor/blocks/ui/qa-celebration";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@scibly/ui/utils";

import { DraggableItemUI } from "@/shared/content/editor/blocks/questions/drag-and-drop/components/draggable-item-ui";

export const DraggableItem = ({
  id,
  label,
  isMatched = false,
  isSelected = false,
  isGraded = false,
  gradedStatus = "neutral",
  disabled = false,
  onClick,
}: {
  id: string;
  label: string;
  isMatched?: boolean;
  isSelected?: boolean;
  isGraded?: boolean;
  gradedStatus?: QAGradedItemStatus;
  disabled?: boolean;
  onClick?: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <DraggableItemUI
      id={id}
      label={label}
      isMatched={isMatched}
      isSelected={isSelected}
      isGraded={isGraded}
      gradedStatus={gradedStatus}
      onClick={onClick}
      ref={setNodeRef}
      style={style}
      className={cn(
        !disabled && "touch-manipulation",
        isDragging && "opacity-0",
      )}
      {...listeners}
      {...attributes}
    />
  );
};
