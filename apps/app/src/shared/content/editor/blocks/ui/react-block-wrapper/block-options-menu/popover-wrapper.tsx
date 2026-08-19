import { Popover, PopoverContent } from "@scibly/ui/components/popover";
import { cn } from "@scibly/ui/utils";
import { memo } from "react";

export type PopoverWrapperProps = {
  children: React.ReactNode;
  popoverContent: React.ReactNode;
  contentClassName?: string;
};

export const PopoverWrapper: React.FC<PopoverWrapperProps> = memo((props) => {
  return (
    <Popover>
      {props.children}
      <PopoverContent
        hideWhenDetached
        className={cn(
          "bg-ink/85 mt-2 flex h-8 w-fit items-center justify-between gap-2 rounded-[10px] border-none px-2 shadow-none",
          props.contentClassName,
        )}
      >
        {props.popoverContent}
      </PopoverContent>
    </Popover>
  );
});

PopoverWrapper.displayName = "PopoverWrapper";
