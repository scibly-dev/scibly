import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Content } from "@tiptap/core";
import type { MountedEditorCommands } from "@/shared/content/editor/runtime/editor-contract";

import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import {
  EditorContent as TiptapEditorContent,
  EditorContext,
  useEditor,
} from "@tiptap/react";
import { useImperativeHandle, useMemo, useState } from "react";

import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";
import {
  createCollaborativeEditorOptions,
  createLocalEditorOptions,
} from "@/shared/content/editor/runtime/create-editor-options";
import { useInitialHtmlHydration } from "@/shared/content/editor/runtime/hooks/use-initial-html-hydration";
import { createMountedEditorCommands } from "@/shared/content/editor/runtime/mounted-editor-commands";

type SharedEditorInstanceProps = {
  isEditorEditable: boolean;
  editorDivRef: React.RefObject<HTMLDivElement | null>;
  wrapperClassName?: string;
  userName: string;
  mediaUploads: "enabled" | "disabled";
  children: React.ReactNode;
  shouldSetStoreEditor?: boolean;
};

type LocalEditorInstanceProps = SharedEditorInstanceProps & {
  mode: "local";
  initialContent: Content;
  commandRef?: React.Ref<MountedEditorCommands>;
  provider?: never;
  disableCursors?: never;
};

type CollaborativeEditorInstanceProps = SharedEditorInstanceProps & {
  mode: "collaborative";
  provider: HocuspocusProvider;
  initialContent?: never;
  commandRef?: never;
  disableCursors?: boolean;
};

type EditorInstanceProps =
  | LocalEditorInstanceProps
  | CollaborativeEditorInstanceProps;

export function EditorInstance(props: EditorInstanceProps) {
  const {
    children,
    editorDivRef,
    isEditorEditable,
    mediaUploads,
    shouldSetStoreEditor = true,
    userName,
    wrapperClassName,
  } = props;
  const setEditor = useQuestionBlockStore((s) => s.setEditor);
  const provider = props.mode === "collaborative" ? props.provider : null;
  const disableCursors =
    props.mode === "collaborative" ? props.disableCursors : undefined;
  const initialContent =
    props.mode === "local" ? props.initialContent : undefined;
  const [mountedInitialContent] = useState(initialContent);
  const mode = props.mode;

  const editorOptions = useMemo(
    () =>
      mode === "collaborative" && provider
        ? createCollaborativeEditorOptions({
            disableCursors,
            editable: isEditorEditable,
            mediaUploads,
            provider,
            userName,
          })
        : createLocalEditorOptions({
            editable: isEditorEditable,
            initialContent: mountedInitialContent ?? "",
            mediaUploads,
            userName,
          }),
    [
      disableCursors,
      isEditorEditable,
      mediaUploads,
      mode,
      mountedInitialContent,
      provider,
      userName,
    ],
  );

  const editor = useEditor({
    ...editorOptions,
    onCreate: ({ editor: created }) => {
      if (shouldSetStoreEditor) {
        setEditor(created);
      }
    },
    onDestroy: () => {
      if (
        shouldSetStoreEditor &&
        useQuestionBlockStore.getState().editor?.isDestroyed
      ) {
        setEditor(null);
      }
    },
  });

  useInitialHtmlHydration(editor, provider ?? null);
  useImperativeHandle(
    props.mode === "local" ? props.commandRef : undefined,
    () => createMountedEditorCommands(editor),
    [editor],
  );

  if (!editor) return null;

  return (
    <ErrorBoundaryWrapper>
      <div
        className={
          wrapperClassName ||
          "mx-auto mt-14 mb-96 flex w-[80vw] max-w-[1000px] flex-col md:mt-20 md:w-[70vw] md:items-center md:justify-center xl:w-[53vw]"
        }
      >
        <EditorContext.Provider value={{ editor }}>
          <div
            className={`joyride-editor mx-auto flex flex-1 flex-col ${wrapperClassName ? "w-full" : "w-[95%] md:w-[calc(100%-8rem)]"} ${isEditorEditable ? "h-full" : "h-auto"}`}
            style={{ maxWidth: 800 }}
            ref={editorDivRef}
          >
            <TiptapEditorContent
              editor={editor}
              className={
                isEditorEditable
                  ? "flex h-full flex-1 flex-col"
                  : "flex flex-col"
              }
            />
            {children}
          </div>
        </EditorContext.Provider>
      </div>
    </ErrorBoundaryWrapper>
  );
}
