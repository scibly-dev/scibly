import { type ReactNode } from "react";

import { HAIRLINE, MUTED } from "./mock-theme";

export function MockWindowBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-8 items-center gap-2 border-b px-3 text-[11px] font-semibold"
      style={{ borderColor: HAIRLINE, color: MUTED }}
    >
      {children}
    </div>
  );
}
