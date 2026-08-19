import type { Editor } from "@tiptap/react";
import type { icons } from "lucide-react";

import { useMemo } from "react";

export type ChangeNodeMenuItem = {
  icon: keyof typeof icons;
  title: string;
  command: () => boolean;
  isActive: () => boolean;
  isDisabled?: () => boolean;
};

export type ChangeNodeMenuGroup = {
  title: string;
  items: ChangeNodeMenuItem[];
};

const useChangeNodeMenuItems = (
  editor: Editor | null,
): ChangeNodeMenuGroup[] => {
  const changeNodeMenuItems: ChangeNodeMenuGroup[] = useMemo(() => {
    if (!editor) return [];
    return [
      {
        title: "Hierarchie",
        items: [
          {
            icon: "Pilcrow",
            title: "Absatz",
            command: () =>
              editor.chain().focus().clearNodes().setParagraph().run(),
            isActive: () =>
              editor.isActive("paragraph") &&
              !editor.isActive("orderedList") &&
              !editor.isActive("bulletList") &&
              !editor.isActive("blockquote"),
          },
          {
            icon: "Heading1",
            title: "Überschrift 1",
            command: () =>
              editor
                .chain()
                .focus()
                .clearNodes()
                .setHeading({ level: 1 })
                .run(),
            isActive: () => editor.isActive("heading", { level: 1 }),
          },
          {
            icon: "Heading2",
            title: "Überschrift 2",
            command: () =>
              editor
                .chain()
                .focus()
                .clearNodes()
                .setHeading({ level: 2 })
                .run(),
            isActive: () => editor.isActive("heading", { level: 2 }),
          },
          {
            icon: "Heading3",
            title: "Überschrift 3",
            command: () =>
              editor
                .chain()
                .focus()
                .clearNodes()
                .setHeading({ level: 3 })
                .run(),
            isActive: () => editor.isActive("heading", { level: 3 }),
          },
        ],
      },
      {
        title: "Listen",
        items: [
          {
            icon: "List",
            title: "Ungeordnete Liste",
            command: () => editor.chain().focus().toggleBulletList().run(),
            isActive: () => editor.isActive("bulletList"),
          },
          {
            icon: "ListOrdered",
            title: "Nummerierte Liste",
            command: () => editor.chain().focus().toggleOrderedList().run(),
            isActive: () => editor.isActive("orderedList"),
          },
        ],
      },
      {
        title: "Fortgeschrittene Blöcke",
        items: [
          {
            icon: "Quote",
            title: "Zitat",
            command: () =>
              editor.chain().focus().clearNodes().setBlockquote().run(),
            isActive: () => editor.isActive("blockquote"),
            isDisabled: () => editor.isActive("heading"),
          },
        ],
      },
    ];
  }, [editor]);

  return changeNodeMenuItems;
};

export default useChangeNodeMenuItems;
