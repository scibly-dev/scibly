import { cn } from "@scibly/ui/utils";
import { type ReactNode } from "react";

interface MarketingSectionFrameProps {
  children: ReactNode;
  className?: string;
}

export function MarketingSectionFrame({
  children,
  className,
}: MarketingSectionFrameProps) {
  return (
    <div
      className={cn("relative z-10 mx-auto w-full max-w-[1200px]", className)}
      data-marketing-section-frame
    >
      {children}
    </div>
  );
}
