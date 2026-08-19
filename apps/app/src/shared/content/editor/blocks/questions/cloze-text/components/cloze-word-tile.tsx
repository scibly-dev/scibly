"use client";

import { cn } from "@scibly/ui/utils";
import { memo } from "react";

import {
  getGradedTileClassName,
  type QAGradedTileVariant,
} from "@/shared/content/editor/blocks/ui/qa-celebration";

type ClozeWordTileProps = {
  label: string;
  variant?: QAGradedTileVariant;
  truncate?: boolean;
  className?: string;
};

export const ClozeWordTile = memo((props: ClozeWordTileProps) => {
  const { label, variant = "default", truncate = true, className } = props;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap select-none",
        truncate && "max-w-full",
        getGradedTileClassName(variant),
        className,
      )}
    >
      <span className={truncate ? "truncate" : undefined}>{label || "…"}</span>
    </span>
  );
});
ClozeWordTile.displayName = "ClozeWordTile";
