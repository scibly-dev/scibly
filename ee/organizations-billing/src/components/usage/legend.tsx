import type { ReactNode } from "react";

import { cn } from "@scibly/ui/utils";

export const Legend = ({
  swatch,
  children,
}: {
  swatch: string;
  children: ReactNode;
}) => (
  <span className="text-ink-muted flex items-center gap-1.5">
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full border border-black/[0.08]",
        swatch,
      )}
      aria-hidden
    />
    {children}
  </span>
);
