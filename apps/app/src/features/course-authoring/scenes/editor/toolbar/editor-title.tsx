import type { Editor } from "@tiptap/react";

import { memo, useEffect, useState } from "react";

import { getTitle } from "@/features/course-authoring/scenes/editor/toolbar/get-editor-title";
import { useTranslation } from "@/i18n/hooks/use-translation";

export const EditorTitle = memo(({ editor }: { editor: Editor }) => {
  const { translations } = useTranslation("editorUi");
  const [rawTitle, setRawTitle] = useState(() => getTitle(editor));

  useEffect(() => {
    const handler = ({ editor: currentEditor }: { editor: Editor }) => {
      const newTitle = getTitle(currentEditor);
      setRawTitle((prev) => (newTitle !== prev ? newTitle : prev));
    };

    editor.on("update", handler);

    return () => {
      editor.off("update", handler);
    };
  }, [editor]);

  const displayTitle = rawTitle.trim()
    ? rawTitle
    : translations.editorTitleUntitled;

  return (
    <h1 className="text-secondary-foreground hidden max-w-[200px] truncate text-lg md:block md:max-w-[300px] md:text-xl lg:max-w-[500px] lg:text-3xl">
      {displayTitle}
    </h1>
  );
});

EditorTitle.displayName = "EditorTitle";
export default EditorTitle;
