import Icon from "@scibly/ui/components/icon";
import {
  chipActiveClass,
  chipClass,
  chipRestClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import React from "react";

import { type BlogPage } from "@/app/[lang]/i18n/blog.types";

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  t: BlogPage;
}

export function FilterToolbar({
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
  t,
}: FilterToolbarProps) {
  const categoryLabels: Record<string, string> = t.categories;

  return (
    <div className="mb-11 flex flex-col-reverse justify-between gap-6 md:flex-row md:items-center">
      {/* Category Filters */}
      <div
        className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto scroll-smooth px-5 pt-1 pb-1.5 md:mx-0 md:px-0"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const label =
            cat === "all" ? t.allCategories : categoryLabels[cat] || cat;

          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                chipClass,
                isActive ? chipActiveClass : chipRestClass,
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative w-full shrink-0 md:w-[300px]">
        <Icon
          name="Search"
          className="text-ink-faint absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="border-hairline text-ink placeholder:text-ink-faint w-full rounded-xl border-2 bg-white py-2 pr-4 pl-10 text-[14px] shadow-[0_3px_0_0_var(--color-lip)] transition-[border-color] outline-none focus:border-[#c9d8f5]"
        />
      </div>
    </div>
  );
}
