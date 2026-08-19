import type { Editor } from "@tiptap/react";
import type { icons } from "lucide-react";
import type { ActionState } from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-editor-state";

import { useMemo } from "react";

import useBubbleMenuCommands from "@/features/course-authoring/scenes/editor/menus/formatting/custom-bubble-menu/hooks/use-bubble-menu-commands";

export type BubbleMenuItem = {
  icon: keyof typeof icons;
  title: string;
  command: () => void;
  isActive: boolean;
  useSeperator: boolean;
  keyShortcut?: string[];
};

const useStandardBubbleMenuItems = (
  editor: Editor | null,
  state: ActionState,
) => {
  const commands = useBubbleMenuCommands(editor);

  const items = useMemo(() => {
    if (!editor) return [];
    return [
      {
        icon: "Bold",
        title: "Fett",
        command: commands.onBold,
        isActive: state.isBold,
        keyShortcut: ["Mod", "B"],
        useSeperator: false,
      },
      {
        icon: "Italic",
        title: "Kursiv",
        command: commands.onItalic,
        isActive: state.isItalic,
        keyShortcut: ["Mod", "I"],
        useSeperator: false,
      },
      {
        icon: "Strikethrough",
        title: "Durchgestrichen",
        command: commands.onStrike,
        isActive: state.isStrike,
        keyShortcut: ["Mod", "Shift", "S"],
        useSeperator: false,
      },
      {
        icon: "Underline",
        title: "Unterstrichen",
        command: commands.onUnderline,
        isActive: state.isUnderline,
        keyShortcut: ["Mod", "U"],
        useSeperator: false,
      },
      {
        icon: "CodeXml",
        title: "Code",
        command: commands.onCode,
        isActive: state.isCode,
        keyShortcut: ["Mod", "E"],
        useSeperator: true,
      },
      {
        icon: "AlignLeft",
        title: "Links ausrichten",
        command: commands.onAlignLeft,
        isActive: state.isAlignLeft,
        keyShortcut: ["Mod", "Shift", "L"],
        useSeperator: false,
      },
      {
        icon: "AlignCenter",
        title: "Zentriert ausrichten",
        command: commands.onAlignCenter,
        isActive: state.isAlignCenter,
        keyShortcut: ["Mod", "Shift", "E"],
        useSeperator: false,
      },
      {
        icon: "AlignRight",
        title: "Rechts ausrichten",
        command: commands.onAlignRight,
        isActive: state.isAlignRight,
        keyShortcut: ["Mod", "Shift", "R"],
        useSeperator: false,
      },
      {
        icon: "AlignJustify",
        title: "Blocksatz ausrichten",
        command: commands.onAlignJustify,
        isActive: state.isAlignJustify,
        keyShortcut: ["Mod", "Shift", "J"],
        useSeperator: true,
      },
    ] satisfies BubbleMenuItem[];
  }, [commands, editor, state]);

  return items;
};

export default useStandardBubbleMenuItems;
