import type { icons } from "lucide-react";

import Icon from "@scibly/ui/components/icon";
import { PopoverTrigger } from "@scibly/ui/components/popover";
import { Separator } from "@scibly/ui/components/separator";
import { memo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/components/tooltip";

export type MediaOptionsMenuItemProps = {
  icon?: keyof typeof icons;
  tooltip: string;
  onClick?: () => void;
  tooltipPosition?: "top" | "right" | "bottom" | "left";
  usePopover?: boolean;
  seperatorType?: "horizontal" | "vertical";
  children?: React.ReactNode;
};

export const MediaOptionsMenuItem: React.FC<MediaOptionsMenuItemProps> = memo(
  (props) => {
    const content = (
      <div
        onClick={props.onClick}
        className="flex h-8 min-w-10 cursor-pointer items-center justify-center px-2"
      >
        {props.icon ? (
          <Icon name={props.icon} className="h-4 w-4 text-white" />
        ) : (
          props.children
        )}
      </div>
    );

    return (
      <>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            {props.usePopover ? (
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
              </PopoverTrigger>
            ) : (
              <TooltipTrigger asChild>{content}</TooltipTrigger>
            )}
            <TooltipContent
              side={props.tooltipPosition}
              className="pointer-events-none mb-2 cursor-text"
            >
              <p>{props.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {props.seperatorType === "vertical" && (
          <Separator className="bg-gray-bg h-6 w-px opacity-50" />
        )}
        {props.seperatorType === "horizontal" && (
          <Separator className="bg-gray-bg my-3 h-px w-6 opacity-50" />
        )}
      </>
    );
  },
);

MediaOptionsMenuItem.displayName = "MediaOptionsMenuItem";
