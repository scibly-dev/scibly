"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@scibly/ui/components/popover";
import { chipClass, chipRestClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { parseAspectRatio } from "../parse-aspect-ratio";

const ASPECT_RATIO_OPTIONS = [
  { ratio: "1:1", labelKey: "square" },
  { ratio: "3:4", labelKey: "portrait" },
  { ratio: "9:16", labelKey: "story" },
  { ratio: "4:3", labelKey: "landscape" },
  { ratio: "16:9", labelKey: "widescreen" },
] as const;

type AspectRatioLabelKey = (typeof ASPECT_RATIO_OPTIONS)[number]["labelKey"];

export function AspectRatioIcon({ ratio }: { ratio: string }) {
  const parsed = parseAspectRatio(ratio);
  const width = parsed?.w ?? 1;
  const height = parsed?.h ?? 1;
  const max = 14;
  const scale = max / Math.max(width, height);

  return (
    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
      <span
        aria-hidden
        className="border-ink block rounded-[2px] border dark:border-neutral-100"
        style={{
          width: Math.max(4, width * scale),
          height: Math.max(4, height * scale),
        }}
      />
    </span>
  );
}

interface InfographicAspectRatioPickerProps {
  labels: NotebookTranslations["studio"]["imageEditor"]["aspectRatio"];
  currentAspectRatio?: string;
  disabled?: boolean;
  onSelect: (ratio: string, label: string) => void;
}

export function InfographicAspectRatioPicker({
  labels,
  currentAspectRatio,
  disabled = false,
  onSelect,
}: InfographicAspectRatioPickerProps) {
  const [open, setOpen] = useState(false);

  const getLabel = (labelKey: AspectRatioLabelKey) => labels.options[labelKey];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            chipClass,
            chipRestClass,
            "inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
          )}
        >
          <AspectRatioIcon ratio={currentAspectRatio ?? "4:3"} />
          <span>{labels.trigger}</span>
          <ChevronDown className="text-ink-faint h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(100vw-2rem,15rem)] p-2"
        onOpenAutoFocus={(event) => event.preventDefault()}
        side="bottom"
        sideOffset={8}
      >
        <p className="text-ink-muted mb-1 px-1.5 text-[12px] leading-snug dark:text-neutral-400">
          {labels.menuTitle}
        </p>
        <ul className="flex flex-col">
          {ASPECT_RATIO_OPTIONS.map((option) => {
            const label = getLabel(option.labelKey);
            const isCurrent = currentAspectRatio === option.ratio;

            return (
              <li key={option.ratio}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[10px] px-1.5 py-1.5 text-left transition-colors outline-none",
                    "hover:bg-ground-soft focus:outline-none focus-visible:outline-none",
                    "dark:hover:bg-neutral-900",
                  )}
                  onClick={() => {
                    onSelect(option.ratio, label);
                    setOpen(false);
                  }}
                >
                  <AspectRatioIcon ratio={option.ratio} />
                  <span className="text-ink min-w-0 flex-1 text-[13px] font-medium dark:text-neutral-100">
                    {label}
                    <span className="text-ink-faint ml-1.5 font-normal dark:text-neutral-500">
                      {option.ratio}
                    </span>
                  </span>
                  {isCurrent ? (
                    <Check className="text-link h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
