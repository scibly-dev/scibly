import type { KnowledgeTranslations } from "../../contracts";
import type { Option } from "./contracts";

import { Input } from "@scibly/ui/components/input";
import { cn } from "@scibly/ui/utils";
import { useState } from "react";

export function Picker({
  t,
  options,
  selected,
  onToggle,
  empty,
}: {
  t: KnowledgeTranslations;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
  empty: string;
}) {
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();
  const shown = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options;

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="border-edge border-b p-1.5">
        <Input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t.form.filterPlaceholder}
          className="h-8 rounded-lg text-[13px]"
        />
      </div>
      <div className="max-h-56 overflow-y-auto overscroll-contain p-1">
        {options.length === 0 ? (
          <p className="text-ink-faint px-2 py-6 text-center text-[12px]">
            {empty}
          </p>
        ) : shown.length === 0 ? (
          <p className="text-ink-faint px-2 py-6 text-center text-[12px]">
            {t.form.noMatches}
          </p>
        ) : (
          shown.map((option) => (
            <label
              key={option.id}
              title={option.label}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px]",
                selected.includes(option.id)
                  ? "bg-primary/10 text-ink font-medium"
                  : "text-ink-muted hover:bg-surface-muted",
              )}
            >
              <input
                type="checkbox"
                className="accent-primary h-3.5 w-3.5 shrink-0"
                checked={selected.includes(option.id)}
                onChange={() => onToggle(option.id)}
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
