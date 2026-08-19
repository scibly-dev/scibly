import type { Editor } from "@tiptap/react";

import { useCallback } from "react";

export const useBubbleMenuCommands = (editor: Editor | null) => {
  const onBold = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
  }, [editor]);
  const onItalic = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
  }, [editor]);
  const onStrike = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleStrike().run();
  }, [editor]);
  const onUnderline = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleUnderline().run();
  }, [editor]);
  const onCode = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleCode().run();
  }, [editor]);

  const onAlignLeft = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setTextAlign("left").run();
  }, [editor]);
  const onAlignCenter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setTextAlign("center").run();
  }, [editor]);
  const onAlignRight = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setTextAlign("right").run();
  }, [editor]);
  const onAlignJustify = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setTextAlign("justify").run();
  }, [editor]);

  const onChangeColor = useCallback(
    (color: string) => {
      if (!editor) return;
      editor.chain().setColor(color).run();
    },
    [editor],
  );
  const onClearColor = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetColor().run();
  }, [editor]);

  const onChangeHighlight = useCallback(
    (color: string) => {
      if (!editor) return;
      editor.chain().setHighlight({ color }).run();
    },
    [editor],
  );
  const onClearHighlight = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetHighlight().run();
  }, [editor]);

  const onSetFont = useCallback(
    (font: string) => {
      if (!font || font.length === 0) {
        if (!editor) return;
        editor.chain().focus().unsetFontFamily().run();
      }
      if (!editor) return;
      editor.chain().focus().setFontFamily(font).run();
    },
    [editor],
  );

  const onLink = useCallback(
    (url: string, inNewTab?: boolean) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .setLink({ href: url, target: inNewTab ? "_blank" : "" })
        .run();
    },
    [editor],
  );

  const onUnsetLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  return {
    onBold,
    onItalic,
    onStrike,
    onUnderline,
    onCode,
    onAlignLeft,
    onAlignCenter,
    onAlignRight,
    onAlignJustify,
    onChangeColor,
    onClearColor,
    onChangeHighlight,
    onClearHighlight,
    onSetFont,
    onLink,
    onUnsetLink,
  };
};

export default useBubbleMenuCommands;
