import type { BubbleMenuItem } from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-standard-bubble-menu-items";

import { type FC, memo } from "react";

import { Toolbar } from "@/shared/ui/components/toolbar";

type ToolbarButtonProps = {
  item?: BubbleMenuItem;
  children?: React.ReactNode;
  tooltip?: string;
  ref?: React.Ref<HTMLButtonElement>;
};

export const ToolbarButtonComponent: FC<ToolbarButtonProps> = ({
  item,
  children,
  tooltip,
  ref,
  ...props
}) => {
  const className =
    "flex h-7 cursor-pointer items-center justify-center gap-1 rounded-[8px] p-1.5 font-semibold ";
  return (
    <>
      {item ? (
        <Toolbar.Button
          tooltip={item.title}
          icon={item.icon}
          tooltipShortcut={item.keyShortcut}
          onClick={item.command}
          active={item.isActive}
          className={className}
          activeClassname="text-link hover:text-link"
          ref={ref}
          {...props}
        >
          {children}
        </Toolbar.Button>
      ) : (
        <Toolbar.Button
          activeClassname="text-link hover:text-link"
          className={className}
          tooltip={tooltip}
          ref={ref}
          {...props}
        >
          {children}
        </Toolbar.Button>
      )}
    </>
  );
};
ToolbarButtonComponent.displayName = "ToolbarButtonComponent";
export default memo(ToolbarButtonComponent);
