import type { Editor } from "@tiptap/react";

export const getTitle = (editor: Editor) => {
  const node = editor.state.doc.childAfter(0).node;
  if (node && node.textContent) {
    return node.textContent.trim();
  }
  return "";
};
