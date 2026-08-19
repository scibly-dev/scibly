import type { Editor } from "@tiptap/core";

export function getQuestionBlockIdsFromEditor(editor: Editor | null): string[] {
  if (!editor?.state?.doc) return [];

  const ids: string[] = [];

  editor.state.doc.descendants((node) => {
    if (
      node.attrs.isQuestionBlock === true &&
      typeof node.attrs.id === "string"
    ) {
      ids.push(node.attrs.id);
    }
  });

  return ids;
}
