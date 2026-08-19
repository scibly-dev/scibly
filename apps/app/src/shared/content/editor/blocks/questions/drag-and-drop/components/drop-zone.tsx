import { useDroppable } from "@dnd-kit/core";
import { cn } from "@scibly/ui/utils";
import React from "react";

import { QA_GAME } from "@/shared/content/editor/blocks/ui/qa-celebration";

export const DropZone = ({
  id,
  label,
  children,
  isOver,
  isReadyToDrop = false,
  onClick,
}: {
  id: string;
  label: string;
  children?: React.ReactNode;
  isOver?: boolean;
  isReadyToDrop?: boolean;
  onClick?: () => void;
}) => {
  const { isOver: isZoneOver, setNodeRef } = useDroppable({
    id: id,
  });

  const isActive = isZoneOver || isOver;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "flex min-h-[5.625rem] flex-col gap-1.5 p-3 transition-all @min-[40rem]:min-h-[7.5rem] @min-[40rem]:gap-2 @min-[40rem]:p-4",
        QA_GAME.slotEmpty,
        isActive && QA_GAME.slotDropActive,
        !isActive && isReadyToDrop && QA_GAME.slotDropReady,
        isReadyToDrop && "cursor-pointer",
      )}
    >
      <div className={QA_GAME.bankLabel}>{label}</div>
      <div className="flex min-w-0 flex-wrap gap-2 @min-[40rem]:gap-2.5">
        {children}
      </div>
    </div>
  );
};
