"use client";

import { Sheet, SheetContent } from "@scibly/ui/components/sheet";
import { cn } from "@scibly/ui/utils";

import { notebookSidebar, notebookSidebarBorder } from "./notebook-shell";

interface CollapsibleSidebarProps {
  side: "left" | "right";
  width: number;
  desktopOpen: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  isResizable?: boolean;
}

const SIDE_BORDER = {
  left: "border-r-2 md:flex",
  right: "border-l-2 md:flex",
} as const;

const SIDE_SHEET_BORDER = {
  left: "border-r-0",
  right: "border-l-0",
} as const;

export function CollapsibleSidebar({
  side,
  width,
  desktopOpen,
  mobileOpen,
  onMobileOpenChange,
  children,
  isResizable = false,
}: CollapsibleSidebarProps) {
  const sidebarClasses = cn(
    "hidden h-full shrink-0 flex-col overflow-hidden",
    !isResizable && "transition-all duration-300 ease-in-out",
    notebookSidebar,
    notebookSidebarBorder,
    !isResizable ? SIDE_BORDER[side] : "md:flex",
    !isResizable &&
      (desktopOpen
        ? "overflow-hidden"
        : `w-0 overflow-hidden ${side === "left" ? "border-r-0" : "border-l-0"}`),
  );

  return (
    <>
      {/* Desktop: collapsible with smooth width animation or fluid resizable width */}
      <div
        className={cn(sidebarClasses, isResizable && "flex w-full")}
        style={isResizable ? undefined : { width: desktopOpen ? width : 0 }}
      >
        <div
          className="flex h-full w-full flex-col"
          style={isResizable ? undefined : { width }}
        >
          {children}
        </div>
      </div>

      {/* Mobile: full-height sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side={side}
          className={cn("p-0 [&>button]:hidden", SIDE_SHEET_BORDER[side])}
          style={{ width, maxWidth: width }}
        >
          {children}
        </SheetContent>
      </Sheet>
    </>
  );
}
