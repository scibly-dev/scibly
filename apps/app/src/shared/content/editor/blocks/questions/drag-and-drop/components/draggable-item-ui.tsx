import { cn } from "@scibly/ui/utils";
import { GripHorizontal } from "lucide-react";
import { forwardRef } from "react";

import {
  getQAGameTileClassName,
  QA_GAME,
  type QAGradedItemStatus,
} from "@/shared/content/editor/blocks/ui/qa-celebration";

export const DraggableItemUI = forwardRef<
  HTMLDivElement,
  {
    id: string;
    label: string;
    isDragged?: boolean;
    isMatched?: boolean;
    isSelected?: boolean;
    isGraded?: boolean;
    gradedStatus?: QAGradedItemStatus;
    style?: React.CSSProperties;
    className?: string;
    onClick?: () => void;
  }
>(
  (
    {
      id,
      label,
      isDragged = false,
      isMatched = false,
      isSelected = false,
      isGraded = false,
      gradedStatus = "neutral",
      style,
      className,
      ...props
    },
    ref,
  ) => {
    const interactive = !isGraded && Boolean(props.onClick);

    return (
      <div
        key={id}
        ref={ref}
        style={style}
        {...props}
        className={cn(
          "max-w-full min-w-0 transition-transform duration-150 select-none",
          QA_GAME.chipMaxWidth,
          isDragged
            ? cn(
                getQAGameTileClassName({ variant: "selected" }),
                "scale-105 opacity-90 shadow-xl",
              )
            : isGraded
              ? getQAGameTileClassName({
                  gradedStatus,
                  isGraded: true,
                  className: "cursor-default",
                })
              : getQAGameTileClassName({
                  isSelected,
                  interactive,
                  className: cn(
                    "cursor-grab active:cursor-grabbing",
                    isMatched && "opacity-80",
                  ),
                }),
          className,
        )}
      >
        <div className="flex min-w-0 items-start gap-2">
          <GripHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
          <span className="min-w-0 flex-1 font-medium wrap-break-word">
            {label}
          </span>
        </div>
      </div>
    );
  },
);

DraggableItemUI.displayName = "DraggableItemUI";
