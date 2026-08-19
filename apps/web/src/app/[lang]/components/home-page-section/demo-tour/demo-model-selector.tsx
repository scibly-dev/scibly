"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { cn } from "@scibly/ui/utils";
import { Check, ChevronDown, KeyRound } from "lucide-react";
import { useState } from "react";

import { BrandLogo, SciblyMark } from "@/components/brand-logo";

import { type DemoModelId, type DemoTourModels } from "./i18n/demo-tour.types";

const MODEL_ORDER: DemoModelId[] = ["scibly", "openai", "anthropic", "byoai"];

const DEFAULT_MODEL_ID: DemoModelId = "byoai";

interface DemoModelSelectorProps {
  models: DemoTourModels;
  menuLabel: string;
  triggerLabel: string;
}

function ProviderMark({ id, name }: { id: DemoModelId; name: string }) {
  switch (id) {
    case "scibly":
      return <SciblyMark size={15} alt={name} />;
    case "openai":
      return <BrandLogo domain="openai.com" alt={name} size={15} />;
    case "anthropic":
      return <BrandLogo domain="anthropic.com" alt={name} size={15} />;
    case "byoai":
      return (
        <KeyRound
          className="size-3.5 text-[#0b4fb0]"
          strokeWidth={2}
          aria-hidden
        />
      );
  }
}

// Selecting a model here is cosmetic — goToDemo (in demo-chat-prompt.tsx) ignores selectedId, so every choice routes through the same CTA.
export function DemoModelSelector({
  models,
  menuLabel,
  triggerLabel,
}: DemoModelSelectorProps) {
  const [selectedId, setSelectedId] = useState(DEFAULT_MODEL_ID);
  const selected = models[selectedId];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className={cn(
            "group flex max-w-[78%] min-w-0 items-center gap-2 rounded-xl bg-[#b9d7ff] py-1.5 pr-3 pl-1.5",
            "shadow-[0_3px_0_0_#7ab4ff,0_5px_12px_-7px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.8)]",
            "ease-press transition-[translate,box-shadow,background-color] duration-100",
            "hover:bg-[#dce8fb] active:translate-y-[3px] active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]",
            "focus-visible:ring-4 focus-visible:ring-[#0066FF]/20 focus-visible:outline-none",
          )}
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgba(15,23,42,0.12)]">
            <ProviderMark id={selectedId} name={selected.name} />
          </span>
          <span className="truncate text-[13px] font-bold text-[#0b4fb0]">
            {selected.name}
          </span>
          <ChevronDown
            size={12}
            strokeWidth={2.6}
            className="shrink-0 text-[#0b4fb0] transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={12}
        className="w-[264px] overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white p-0 shadow-[0_18px_40px_-16px_rgba(15,23,42,0.35),0_3px_0_0_rgba(15,23,42,0.05)]"
      >
        <DropdownMenuLabel className="text-ink-soft border-b border-[#f1f5f9] px-[13px] py-[9px] text-[11px] font-bold">
          {menuLabel}
        </DropdownMenuLabel>
        <div className="p-1">
          {MODEL_ORDER.map((id) => {
            const model = models[id];
            const isSelected = id === selectedId;

            return (
              <DropdownMenuItem
                key={id}
                onClick={() => setSelectedId(id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2",
                  isSelected ? "bg-[#eef5ff]" : "focus:bg-[#f2f4fb]",
                )}
              >
                <span className="flex size-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[7px] border border-[#e2e8f0] bg-white">
                  <ProviderMark id={id} name={model.name} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-[#0f172a]">
                    {model.name}
                  </span>
                  <span className="text-ink-soft block truncate text-[12.5px]">
                    {model.detail}
                  </span>
                </span>
                {isSelected ? (
                  <Check
                    className="size-[13px] shrink-0 text-[#0066FF]"
                    strokeWidth={2.75}
                    aria-hidden
                  />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
