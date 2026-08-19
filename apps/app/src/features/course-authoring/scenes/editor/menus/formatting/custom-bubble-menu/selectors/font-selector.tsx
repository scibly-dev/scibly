import type { FC } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";

import ToolbarButton from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/toolbar-button";
import { ScrollArea } from "@/shared/ui/components/scroll-area";

export type FontFamilies =
  | "Arial"
  | "Inter"
  | "Times New Roman"
  | "Courier"
  | "Courier New"
  | "Monospace"
  | "Georgia"
  | "Garamond"
  | "Serig"
  | "Helvetica";

const FONT_FAMILIES: FontFamilies[] = [
  "Arial",
  "Inter",
  "Times New Roman",
  "Courier",
  "Courier New",
  "Monospace",
  "Georgia",
  "Garamond",
  "Serig",
  "Helvetica",
];

/** The mark's `fontFamily` is whatever was authored or pasted; only one this
 * selector offers can be shown as the current font. */
export const asFontFamily = (font: unknown): FontFamilies | undefined =>
  FONT_FAMILIES.find((family) => family === font);

type FontSelectorProps = {
  selectFontCommand: (font: FontFamilies) => void;
  currentFont: FontFamilies;
};

export const FontSelector: FC<FontSelectorProps> = ({
  selectFontCommand,
  currentFont,
}) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip="Schriftart">
          <span
            className="text-ink min-w-fit text-xs font-semibold text-nowrap"
            style={{ fontFamily: currentFont }}
          >
            {currentFont}
          </span>
          <ChevronDown className="h-3 w-3" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent usePortal={false} className="mt-2 w-48">
        <ScrollArea className="max-h-[min(60vh,35rem)] overflow-auto">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Schriftart</DropdownMenuLabel>
            {FONT_FAMILIES.map((fontFamily, index) => (
              <DropdownMenuItem
                key={index}
                onSelect={() => {
                  selectFontCommand(fontFamily);
                }}
              >
                <span
                  style={{
                    fontFamily,
                  }}
                  className="text-ink text-sm"
                >
                  {fontFamily}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
FontSelector.displayName = "FontSelector";
export default FontSelector;
