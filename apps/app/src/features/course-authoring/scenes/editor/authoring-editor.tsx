"use client";

import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { useRef } from "react";

import "@/shared/content/editor/styles/base-editor.css";
import MenuRenderer, {
  type MenuRendererProps,
} from "@/features/course-authoring/scenes/editor/menus/menu-renderer";
import EditorContent, {
  type EditorBehaviorProps,
  type MountedEditorCommands,
} from "@/shared/content/editor/runtime";

export type EditorProps = EditorBehaviorProps & {
  visibilityOptions?: MenuRendererProps["visibilityOptions"];
};

export type { MountedEditorCommands };

export const Editor = ({
  visibilityOptions,
  ...editorContentProps
}: EditorProps) => {
  const menuContainerRef = useRef<HTMLDivElement>(null);

  return (
    <ErrorBoundaryWrapper>
      <EditorContent
        {...editorContentProps}
        menuContainerRef={menuContainerRef}
      >
        <div
          className="fixed top-0 right-0 bottom-0 left-0 z-50 h-fit"
          ref={menuContainerRef}
        >
          <MenuRenderer visibilityOptions={visibilityOptions} />
        </div>
      </EditorContent>
    </ErrorBoundaryWrapper>
  );
};

Editor.displayName = "Editor";
export default Editor;
