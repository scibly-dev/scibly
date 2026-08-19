"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { Search } from "lucide-react";

type T = NotebookTranslations["sources"]["pagePicker"];

interface PagePickerSearchBarProps {
  query: string;
  isSearching: boolean;
  t: T;
  onChange: (value: string) => void;
}

export function PagePickerSearchBar({
  query,
  isSearching,
  t,
  onChange,
}: PagePickerSearchBarProps) {
  return (
    <div className="relative border-b border-neutral-100 dark:border-neutral-800/60">
      <Search className="absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
      <input
        id="integration-page-search"
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isSearching ? t.searchPlaceholder : t.filterPages}
        autoFocus={isSearching}
        className="w-full bg-transparent py-3 pr-4 pl-10 text-[13px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
      />
    </div>
  );
}
