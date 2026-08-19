import type { icons } from "lucide-react";

import { Button, type ButtonProps } from "@scibly/ui/components/button";
import Icon from "@scibly/ui/components/icon";
import { cn } from "@scibly/ui/utils";
import React, {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLProps,
} from "react";

import Tooltip from "./new-tooltip";
import { Surface } from "./surface";
import { TooltipProvider } from "./tooltip";

type ToolbarWrapperProps = {
  shouldShowContent?: boolean;
  isVertical?: boolean;
} & HTMLProps<HTMLDivElement>;

const ToolbarWrapperComponent = ({
  shouldShowContent = true,
  children,
  isVertical = false,
  className,
  ref,
  ...rest
}: ToolbarWrapperProps) => {
  const toolbarClassName = cn(
    "inline-flex h-full leading-none gap-0.5",
    isVertical ? "flex-col p-2" : "flex-row p-1 items-center",
    className,
  );

  return (
    shouldShowContent && (
      <TooltipProvider delayDuration={500} skipDelayDuration={300}>
        <Surface className={toolbarClassName} {...rest} ref={ref}>
          {children}
        </Surface>
      </TooltipProvider>
    )
  );
};

ToolbarWrapperComponent.displayName = "ToolbarWrapperComponent";

type ToolbarDividerProps = {
  horizontal?: boolean;
} & HTMLProps<HTMLDivElement>;

const ToolbarDividerComponent = forwardRef<HTMLDivElement, ToolbarDividerProps>(
  ({ horizontal, className, ...rest }, ref) => {
    const dividerClassName = cn(
      "bg-hairline dark:bg-neutral-600",
      horizontal
        ? "w-full min-w-6 h-px my-1 first:mt-0 last:mt-0"
        : "h-full min-h-6 w-px mx-1 first:ml-0 last:mr-0",
      className,
    );

    return <div className={dividerClassName} ref={ref} {...rest} />;
  },
);

ToolbarDividerComponent.displayName = "ToolbarDividerComponent";

export type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: keyof typeof icons;
  active?: boolean;
  activeClassname?: string;
  tooltip?: string;
  tooltipShortcut?: string[];
  buttonSize?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  ref?: React.Ref<HTMLButtonElement>;
};

export const ToolbarButtonComponent = ({
  children,
  buttonSize = "icon",
  variant = "ghost",
  className,
  icon,
  tooltip,
  tooltipShortcut,
  activeClassname,
  active,
  ref,
  ...rest
}: ToolbarButtonProps) => {
  const buttonClass = cn(
    "gap-1 min-w-8 px-2 w-auto rounded-[8px] focus-visible:ring-0",
    className,
    active && activeClassname,
  );

  const content = (
    <Button
      className={buttonClass}
      variant={variant}
      size={buttonSize}
      ref={ref}
      {...rest}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} shortcut={tooltipShortcut}>
        {content}
      </Tooltip>
    );
  }

  return content;
};

ToolbarButtonComponent.displayName = "ToolbarButtonComponent";

export const Toolbar = {
  Wrapper: ToolbarWrapperComponent,
  Divider: ToolbarDividerComponent,
  Button: ToolbarButtonComponent,
};
