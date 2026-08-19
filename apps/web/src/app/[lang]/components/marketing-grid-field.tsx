import type { Pillar } from "./marketing-tokens";

import { cn } from "@scibly/ui/utils";
import { type CSSProperties, type ReactNode } from "react";

const gridStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='68' height='68' viewBox='0 0 68 68' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 68 0 L 0 0 0 68' fill='none' stroke='%23cbd5e1' stroke-opacity='.52' stroke-width='1'/%3E%3C/svg%3E\")",
  backgroundSize: "68px 68px",
  backgroundPosition: "0 34px",
} satisfies CSSProperties;

const raisedTileClassName =
  "absolute size-[58px] items-center justify-center rounded-[10px] border border-[#d5dee9] shadow-[1px_1px_0_#d2dce8,2px_2px_0_#ced9e6,3px_3px_0_#cad6e3,7px_9px_18px_-14px_rgba(15,35,61,0.55)]";

export function MarketingGridField({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 opacity-25 md:opacity-30 lg:opacity-35",
        className,
      )}
      style={gridStyle}
      data-marketing-grid-field
      aria-hidden
    />
  );
}

export function MarketingGridTile({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn(raisedTileClassName, className)}
      style={style}
      data-marketing-grid-tile
      aria-hidden
    >
      {children}
    </span>
  );
}

export function MarketingGridIndent({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute size-[58px] rounded-[10px] border border-[#d9e1e9] bg-[#f1f5f9] shadow-[inset_3px_3px_6px_-4px_rgba(15,35,61,0.24),inset_-2px_-2px_4px_-3px_rgba(255,255,255,0.8),0_1px_2px_rgba(15,35,61,0.04)]",
        className,
      )}
      data-marketing-grid-indent
      aria-hidden
    />
  );
}

export type AtmosphereTile = {
  id: string;

  className: string;
  icon: ReactNode;
  tone: Pillar;
};

export function MarketingAtmosphere({
  tiles = [],
  indents = [],
}: {
  tiles?: readonly AtmosphereTile[];
  indents?: readonly string[];
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-marketing-atmosphere
      aria-hidden
    >
      <MarketingGridField />

      {tiles.map((tile) => (
        <MarketingGridTile
          key={tile.id}
          className={tile.className}
          style={{
            backgroundColor: tile.tone.softColor,
            color: tile.tone.accentColor,
          }}
        >
          {tile.icon}
        </MarketingGridTile>
      ))}

      {indents.map((className) => (
        <MarketingGridIndent key={className} className={className} />
      ))}
    </div>
  );
}
