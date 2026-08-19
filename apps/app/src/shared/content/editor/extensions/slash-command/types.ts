import type { Editor } from "@tiptap/core";
import type { icons } from "lucide-react";
import type { StaticImageData } from "next/image";

export interface Command {
  name: string;
  label: string;
  description: string;
  aliases?: string[];
  aiCreditGated?: boolean;
  iconName: keyof typeof icons | StaticImageData;
  action: (editor: Editor) => void;
  shouldBeHidden?: (editor: Editor) => boolean;
}

export interface Group {
  name: string;
  title: string;
  commands: Command[];
}

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SlashCommandStorage {
  rect: AnchorRect;
  hideAiCommands: boolean;
}
