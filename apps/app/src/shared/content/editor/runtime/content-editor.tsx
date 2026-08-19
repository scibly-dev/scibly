"use client";

import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { useRef } from "react";

import "@/shared/content/editor/styles/base-editor.css";

import EditorContent, {
  type EditorBehaviorProps,
  type MountedEditorCommands,
} from "./index";

type ContentEditorProps = EditorBehaviorProps;
export type { MountedEditorCommands };

export function ContentEditor(props: ContentEditorProps) {
  const menuContainerRef = useRef<HTMLDivElement>(null);

  return (
    <ErrorBoundaryWrapper>
      <EditorContent {...props} menuContainerRef={menuContainerRef}>
        <div ref={menuContainerRef} />
      </EditorContent>
    </ErrorBoundaryWrapper>
  );
}
