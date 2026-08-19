import { useDroppable } from "@dnd-kit/core";
import { cn } from "@scibly/ui/utils";
import React from "react";

import { QA_GAME } from "@/shared/content/editor/blocks/ui/qa-celebration";

export const AvailableItemsZone = ({
  children,
  onClick,
  isReadyToDrop = false,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  isReadyToDrop?: boolean;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: "unassigned",
  });

  const isActive = isOver;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "flex min-h-[3.75rem] min-w-0 flex-wrap gap-2 transition-all @min-[40rem]:min-h-[5rem] @min-[40rem]:gap-2.5",
        QA_GAME.bankTray,
        isActive && QA_GAME.slotDropActive,
        !isActive && isReadyToDrop && QA_GAME.slotDropReady,
        isReadyToDrop && "cursor-pointer",
      )}
    >
      {children}
    </div>
  );
};
