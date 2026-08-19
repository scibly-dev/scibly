"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import React, { type JSX, useMemo } from "react";

export interface TooltipProps {
  children?: string | React.ReactNode;
  enabled?: boolean;
  title?: string;
  shortcut?: string[];
  content?: React.ReactNode;
}

const isMac =
  typeof window !== "undefined"
    ? navigator.platform.toUpperCase().includes("MAC")
    : false;

const ShortcutKeyComponent = ({
  children,
}: {
  children: string;
}): JSX.Element => {
  const className =
    "inline-flex items-center justify-center w-5 h-5 p-1 text-[0.625rem] rounded font-semibold leading-none text-gray-200 bg-gray-800";

  if (children === "Mod") {
    return <kbd className={className}>{isMac ? "⌘" : "Strg"}</kbd>;
  }

  if (children === "Shift") {
    return <kbd className={className}>⇧</kbd>;
  }

  if (children === "Alt") {
    return <kbd className={className}>{isMac ? "⌥" : "Alt"}</kbd>;
  }

  return <kbd className={className}>{children}</kbd>;
};

export const Tooltip = ({
  children,
  enabled = true,
  title,
  shortcut,
  content,
}: TooltipProps): JSX.Element => {
  const triggerChild = useMemo(() => {
    if (children === null || children === undefined) {
      return null;
    }

    if (React.isValidElement(children)) {
      return children;
    }

    return <span className="inline-flex">{children}</span>;
  }, [children]);

  if (!enabled || !triggerChild) {
    return <>{children}</>;
  }

  const body = content ?? (
    <>
      {title && <span className="text-xs font-medium text-white">{title}</span>}
      {shortcut && (
        <span className="flex items-center gap-0.5">
          {shortcut.map((shortcutKey) => (
            <ShortcutKeyComponent key={shortcutKey}>
              {shortcutKey}
            </ShortcutKeyComponent>
          ))}
        </span>
      )}
    </>
  );

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        {triggerChild}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={8}
          className="flex items-center justify-center gap-2 rounded-lg bg-black px-2.5 py-1 shadow-sm"
          style={{ zIndex: 99999 }}
          tabIndex={-1}
        >
          {body}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};

export default Tooltip;
