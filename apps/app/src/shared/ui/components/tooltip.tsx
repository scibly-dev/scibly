"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@scibly/ui/utils";
import * as React from "react";

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = TooltipPrimitive.Root;

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// A disabled control emits no events, so the wrapping span carries hover and focus.
export function DisabledReasonTooltip({
  reason,
  side = "bottom",
  className,
  children,
}: {
  reason: string | null;
  side?: React.ComponentProps<typeof TooltipContent>["side"];

  className?: string;
  children: React.ReactNode;
}) {
  if (!reason) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className={className}>
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[15rem]">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
