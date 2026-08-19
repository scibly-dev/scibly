import { cn } from "@scibly/ui/utils";
import React from "react";

import { type BlogPost } from "@/app/[lang]/blog/components/posts";

import { CATEGORY_TONES } from "../utils/category-tones";

interface CategoryBadgeProps {
  category: BlogPost["category"];
  label: string;
  className?: string;
}

export function CategoryBadge({
  category,
  label,
  className,
}: CategoryBadgeProps) {
  const tone = CATEGORY_TONES[category];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-[5px] text-[11px] leading-none font-semibold shadow-[0_2px_0_0_var(--badge-lip)]",
        className,
      )}
      style={{
        backgroundColor: tone.softColor,
        color: tone.accentColor,
        "--badge-lip": tone.lipColor,
      }}
    >
      {label}
    </span>
  );
}
