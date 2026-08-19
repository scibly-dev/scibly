"use client";

import type { NodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";

import { floatingPanelClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import {
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyStart,
  MessageSquare,
} from "lucide-react";

import { resolveBlockDocUrl } from "@/lib/utils";
import {
  GUIDE_LAYOUT_IDS,
  GUIDE_LAYOUTS,
  type GuideLayoutId,
} from "@/shared/content/editor/blocks/guide-character/utils/guide-layouts";
import { BlockSettingsFooter } from "@/shared/content/editor/blocks/ui/block-settings-ui";
import {
  MediaOptionsMenuItem,
  PopoverWrapper,
} from "@/shared/content/editor/blocks/ui/react-block-wrapper/block-options-menu";

export const DOC_LINK = resolveBlockDocUrl("interactive", "guide-character");

const LAYOUT_ICONS = {
  left: AlignHorizontalJustifyStart,
  right: AlignHorizontalJustifyEnd,
  top: AlignVerticalJustifyStart,
  inline: MessageSquare,
} satisfies Record<GuideLayoutId, ComponentType<{ className?: string }>>;

interface GuideCharacterChromeProps {
  nodeViewProps: NodeViewProps;
  layout: GuideLayoutId;
}

export function GuideCharacterChrome({
  nodeViewProps,
  layout,
}: GuideCharacterChromeProps) {
  const settingsContent = (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-neutral-500">Layout</span>
        <div className="grid grid-cols-4 gap-1.5">
          {GUIDE_LAYOUT_IDS.map((id) => {
            const meta = GUIDE_LAYOUTS[id];
            const LayoutIconComponent = LAYOUT_ICONS[id];
            const isSelected = layout === id;
            return (
              <button
                key={id}
                type="button"
                title={meta.description}
                aria-label={meta.label}
                aria-pressed={isSelected}
                onClick={() => nodeViewProps.updateAttributes({ layout: id })}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 transition-all",
                  isSelected
                    ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
                )}
              >
                <LayoutIconComponent className="h-4 w-4 text-neutral-600" />
                <span className="text-[10px] font-semibold text-neutral-600">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <BlockSettingsFooter nodeViewProps={nodeViewProps} />
    </div>
  );

  return (
    <div
      data-guide-settings-chrome=""
      className={cn(
        "bg-ink/85 absolute top-0 right-0 z-30 flex h-8 items-center rounded-[10px]",
        "opacity-0 transition-opacity duration-150 group-hover/guide:opacity-100",
        "pointer-events-none group-hover/guide:pointer-events-auto",
      )}
    >
      <PopoverWrapper
        contentClassName={cn(
          floatingPanelClass,
          "z-50 h-auto w-[300px] flex-col items-stretch gap-0.5 p-1 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none",
        )}
        popoverContent={settingsContent}
      >
        <MediaOptionsMenuItem
          icon="Settings"
          tooltip="Guide settings"
          usePopover
        />
      </PopoverWrapper>
      <MediaOptionsMenuItem
        icon="BookOpenText"
        tooltip="Documentation"
        onClick={() => window.open(DOC_LINK, "_blank")}
      />
    </div>
  );
}
