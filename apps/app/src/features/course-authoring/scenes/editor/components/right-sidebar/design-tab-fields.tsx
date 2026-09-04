import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { fieldClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Check, ChevronDown, Paintbrush, Palette } from "lucide-react";

import {
  type LessonDesign,
  MODERN_MINIMAL_DESIGN,
} from "@/shared/content/course/course-validation";

import { DESIGN_PRESETS } from "./design-presets";

type DesignPreset = (typeof DESIGN_PRESETS)[number];

export const PresetPicker = ({
  currentPreset,
  onSelect,
}: {
  currentPreset: DesignPreset | undefined;
  onSelect: (preset: DesignPreset) => void;
}) => {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-pink-500/10 dark:bg-pink-500/20">
          <Palette className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
        </div>
        <h3 className="text-ink text-[14px] font-bold dark:text-neutral-100">
          Design Presets
        </h3>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              fieldClass,
              "flex h-10 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-[14px] transition-[translate,border-color,box-shadow] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
            )}
          >
            <div className="flex items-center gap-2">
              {currentPreset ? (
                <>
                  <div className="flex -space-x-1">
                    <div
                      className="border-hairline h-3 w-3 rounded-full border-2 dark:border-neutral-700"
                      style={{
                        backgroundColor: currentPreset.design.backgroundColor,
                      }}
                    />
                    <div
                      className="border-hairline h-3 w-3 rounded-full border-2 dark:border-neutral-700"
                      style={{
                        backgroundColor: currentPreset.design.primaryColor,
                      }}
                    />
                  </div>
                  <span>{currentPreset.label}</span>
                </>
              ) : (
                <span>Custom</span>
              )}
            </div>
            <ChevronDown className="text-ink-faint h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          {DESIGN_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => onSelect(preset)}
              className="flex items-center justify-between py-2 text-[13px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex shrink-0 -space-x-1">
                  <div
                    className="border-hairline h-4 w-4 rounded-full border-2 dark:border-neutral-700"
                    style={{ backgroundColor: preset.design.backgroundColor }}
                  />
                  <div
                    className="border-hairline h-4 w-4 rounded-full border-2 dark:border-neutral-700"
                    style={{ backgroundColor: preset.design.primaryColor }}
                  />
                </div>
                <span>{preset.label}</span>
              </div>
              {currentPreset?.value === preset.value ? (
                <Check className="text-link h-4 w-4" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ColorField = ({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-ink-muted text-[13px] font-medium dark:text-neutral-400">
        {label}
      </label>
      <div className="relative">
        <div
          className="border-hairline absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 rounded-full border-2 dark:border-neutral-700"
          style={{ backgroundColor: value || "transparent" }}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(
            fieldClass,
            "h-10 w-full rounded-xl pr-3 pl-9 font-mono text-[14px] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
          )}
        />
      </div>
    </div>
  );
};

export function DesignTabFields({
  design,
  onPreset,
  onColor,
}: {
  design: LessonDesign;
  onPreset: (design: LessonDesign) => void;
  onColor: (
    field: "backgroundColor" | "textColor" | "primaryColor",
    value: string,
  ) => void;
}) {
  const currentPreset = DESIGN_PRESETS.find(
    (preset) =>
      preset.design.backgroundColor === design.backgroundColor &&
      preset.design.textColor === design.textColor &&
      preset.design.primaryColor === design.primaryColor,
  );
  return (
    <div key="design" className="flex flex-col gap-8 p-6">
      <p className="text-ink-muted text-[13px] dark:text-neutral-400">
        Applies to every scene in this lesson. Saves as you edit.
      </p>
      <PresetPicker
        currentPreset={currentPreset}
        onSelect={(preset) => onPreset(preset.design)}
      />
      <div className="bg-hairline h-px w-full dark:bg-neutral-800/60" />
      <div>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-emerald-500/10 dark:bg-emerald-500/20">
            <Paintbrush className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-ink text-[14px] font-bold dark:text-neutral-100">
            Custom Colors
          </h3>
        </div>
        <div className="flex flex-col gap-5">
          <ColorField
            label="Background Color"
            value={design.backgroundColor}
            placeholder={MODERN_MINIMAL_DESIGN.backgroundColor}
            onChange={(value) => onColor("backgroundColor", value)}
          />
          <ColorField
            label="Text Color"
            value={design.textColor}
            placeholder={MODERN_MINIMAL_DESIGN.textColor}
            onChange={(value) => onColor("textColor", value)}
          />
          <ColorField
            label="Primary Color"
            value={design.primaryColor}
            placeholder={MODERN_MINIMAL_DESIGN.primaryColor}
            onChange={(value) => onColor("primaryColor", value)}
          />
        </div>
      </div>
    </div>
  );
}
