import type { KnowledgeTranslations } from "../../contracts";
import type { Option } from "./contracts";

import { Button } from "@scibly/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@scibly/ui/components/popover";
import { ChevronDown } from "lucide-react";

import { Picker } from "./picker";

export function MultiSelect({
  t,
  options,
  selected,
  onToggle,
  placeholder,
  empty,
}: {
  t: KnowledgeTranslations;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
  placeholder: string;
  empty: string;
}) {
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span
            className={selected.length === 0 ? "text-ink-faint" : "text-ink"}
          >
            {selected.length === 0
              ? placeholder
              : t.form.selected.replace("{count}", String(selected.length))}
          </span>
          <ChevronDown
            className="text-ink-faint h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
      >
        <Picker
          t={t}
          options={options}
          selected={selected}
          onToggle={onToggle}
          empty={empty}
        />
      </PopoverContent>
    </Popover>
  );
}
