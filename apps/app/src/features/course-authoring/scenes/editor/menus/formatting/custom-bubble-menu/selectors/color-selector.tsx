import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { type FC, memo } from "react";

import ToolbarButton from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/toolbar-button";
import { ScrollArea } from "@/shared/ui/components/scroll-area";

export type FontColor =
  | "hsl(var(--primary))"
  | "#9333EA"
  | "#E00000"
  | "#EAB308"
  | "#2563EB"
  | "#008A00"
  | "#FFA500"
  | "#BA4081"
  | "#A8A29E";

export type HighlightColor =
  | "hsl(var(--popover))"
  | "rgba(147, 51, 234, 0.3)"
  | "rgba(224, 0, 0, 0.3)"
  | "rgba(234, 179, 8, 0.3)"
  | "rgba(37, 99, 235, 0.3)"
  | "rgba(0, 138, 0, 0.3)"
  | "rgba(255, 165, 0, 0.3)"
  | "rgba(186, 64, 129, 0.3)"
  | "rgba(168, 162, 158, 0.3)";

type BubbleColorMenuItem<T = FontColor | HighlightColor> = {
  name: string;
  color: T;
};

const TEXT_COLORS: BubbleColorMenuItem<FontColor>[] = [
  {
    name: "Standard",
    color: "hsl(var(--primary))",
  },
  {
    name: "Lila",
    color: "#9333EA",
  },
  {
    name: "Rot",
    color: "#E00000",
  },
  {
    name: "Gelb",
    color: "#EAB308",
  },
  {
    name: "Blau",
    color: "#2563EB",
  },
  {
    name: "Grün",
    color: "#008A00",
  },
  {
    name: "Orange",
    color: "#FFA500",
  },
  {
    name: "Pink",
    color: "#BA4081",
  },
  {
    name: "Grau",
    color: "#A8A29E",
  },
];

const BACKGROUND_COLORS: BubbleColorMenuItem<HighlightColor>[] = [
  {
    name: "Standard Hintergrund",
    color: "hsl(var(--popover))",
  },
  {
    name: "Lila Hintergrund",
    color: "rgba(147, 51, 234, 0.3)",
  },
  {
    name: "Roter Hintergrund",
    color: "rgba(224, 0, 0, 0.3)",
  },
  {
    name: "Gelber Hintergrund",
    color: "rgba(234, 179, 8, 0.3)",
  },
  {
    name: "Blauer Hintergrund",
    color: "rgba(37, 99, 235, 0.3)",
  },
  {
    name: "Grüner Hintergrund",
    color: "rgba(0, 138, 0, 0.3)",
  },
  {
    name: "Orangener Hintergrund",
    color: "rgba(255, 165, 0, 0.3)",
  },
  {
    name: "Pinker Hintergrund",
    color: "rgba(186, 64, 129, 0.3)",
  },
  {
    name: "Grauer Hintergrund",
    color: "rgba(168, 162, 158, 0.3)",
  },
];

type BubbleColorMenuItemProps = {
  name: string;
  color?: FontColor | HighlightColor;
  onSelected: () => void;
  isBackgroundItem?: boolean;
};

/** The mark's `color` is whatever was authored or pasted; only a color the
 * palette offers can be shown as the selected swatch. */
export const asFontColor = (color: unknown): FontColor | undefined =>
  TEXT_COLORS.find((item) => item.color === color)?.color;

export const asHighlightColor = (color: unknown): HighlightColor | undefined =>
  BACKGROUND_COLORS.find((item) => item.color === color)?.color;

const getFallbackTextColor = (color?: FontColor) => {
  if (!color) {
    return "hsl(var(--primary))";
  }
  return color;
};

const getFallbackHighlightColor = (color?: HighlightColor) => {
  if (!color) {
    return "hsl(var(--popover))";
  }
  return color;
};

const ColorSelectorItemComponent: FC<BubbleColorMenuItemProps> = memo(
  ({ name, color, onSelected, isBackgroundItem }) => {
    return (
      <DropdownMenuItem onClick={onSelected} className="flex gap-2">
        <div
          className="dark:border-primary flex h-6 w-6 items-center justify-center rounded-sm border"
          style={{
            backgroundColor: isBackgroundItem
              ? color
              : getFallbackHighlightColor(),
          }}
        >
          <span
            className="font-semibold"
            style={{
              color: isBackgroundItem ? getFallbackTextColor() : color,
            }}
          >
            A
          </span>
        </div>
        <span className="text-ink text-sm">{name}</span>
      </DropdownMenuItem>
    );
  },
);

ColorSelectorItemComponent.displayName = "ColorSelectorItemComponent";

type ColorSelectorProps = {
  onClearTextColor: () => void;
  onClearHighlight: () => void;
  textColorCommand: (color: FontColor) => void;
  highlightColorCommand: (color: HighlightColor) => void;
  currentTextColor?: FontColor;
  currentHighlightColor?: HighlightColor;
};

export const ColorSelector: FC<ColorSelectorProps> = ({
  onClearTextColor,
  onClearHighlight,
  textColorCommand,
  highlightColorCommand,
  currentTextColor,
  currentHighlightColor,
}) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip="Text/Highlight Color">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-sm border"
            style={{
              backgroundColor: getFallbackHighlightColor(currentHighlightColor),
            }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: getFallbackTextColor(currentTextColor) }}
            >
              A
            </span>
          </div>
          <ChevronDown className="h-3 w-3" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent usePortal={false} className="mt-2 w-56">
        <ScrollArea className="max-h-[min(60vh,35rem)] overflow-auto">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Textfarbe</DropdownMenuLabel>
            {TEXT_COLORS.map((item) => (
              <ColorSelectorItemComponent
                key={item.color}
                name={item.name}
                color={getFallbackTextColor(item.color)}
                onSelected={() => {
                  if (item.name === "Default") {
                    onClearTextColor();
                    return;
                  }
                  textColorCommand(item.color);
                }}
              />
            ))}
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Hintergrundfarbe</DropdownMenuLabel>
            {BACKGROUND_COLORS.map((item) => (
              <ColorSelectorItemComponent
                key={item.color}
                name={item.name}
                color={getFallbackHighlightColor(item.color)}
                onSelected={() => {
                  if (item.name === "Default background") {
                    onClearHighlight();
                    return;
                  }
                  highlightColorCommand(item.color);
                }}
                isBackgroundItem
              />
            ))}
          </DropdownMenuGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
ColorSelector.displayName = "ColorSelector";
export default ColorSelector;
