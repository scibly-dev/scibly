import { authClient } from "@scibly/auth/client";
import useOnClickOutside from "@scibly/lib/hooks/use-on-click-outside";
import { type RefObject, useRef } from "react";

import { SessionAwareRoom } from "@/shared/content/editor/collaboration/session-aware-room";
import { ConnectionBoundary } from "@/shared/content/editor/runtime/components/connection-boundary";
import { EditorInstance } from "@/shared/content/editor/runtime/components/editor-instance";
import { LoadingState } from "@/shared/content/editor/runtime/components/loading-state";
import {
  EditorCapabilitiesProvider,
  resolveEditorCapabilities,
} from "@/shared/content/editor/runtime/context/editor-capabilities-context";
import {
  type CollaborativeEditorProps,
  type EditorBehaviorProps,
  type EditorVariant,
} from "@/shared/content/editor/runtime/editor-contract";

export type {
  CollaborativeEditorProps,
  EditorBehaviorProps,
  EditorVariant,
  LocalEditorProps,
  MountedEditorCommands,
} from "@/shared/content/editor/runtime/editor-contract";

type EditorContentFrameProps = {
  children: React.ReactNode;
  menuContainerRef: RefObject<HTMLDivElement | null>;
};

type EditorContentProps = EditorContentFrameProps & EditorBehaviorProps;

type CollaborativeEditorContentProps = CollaborativeEditorProps & {
  children: React.ReactNode;
  editorDivRef: RefObject<HTMLDivElement | null>;
  mediaUploads: "enabled" | "disabled";
};

function isVariantEditable(variant: EditorVariant): boolean {
  return variant.type === "author" && !variant.isReadOnly;
}

export const CollaborativeEditorContent = ({
  children,
  documentId,
  editorDivRef,
  mediaUploads,
  shouldSetStoreEditor,
  variant = { type: "author" },
  wrapperClassName,
}: CollaborativeEditorContentProps) => {
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return <LoadingState wrapperClassName={wrapperClassName} />;
  }

  const userName = session.user.username ?? session.user.name;

  return (
    <SessionAwareRoom
      key={documentId}
      name={documentId}
      kind={variant.type === "preview" ? "scene-preview" : "scene-author"}
    >
      <ConnectionBoundary
        key={documentId}
        isEditorEditable={isVariantEditable(variant)}
        editorDivRef={editorDivRef}
        wrapperClassName={wrapperClassName}
        userName={userName}
        mediaUploads={mediaUploads}
        disableCursors={variant.type === "preview"}
        shouldSetStoreEditor={
          shouldSetStoreEditor ?? variant.type !== "preview"
        }
      >
        {children}
      </ConnectionBoundary>
    </SessionAwareRoom>
  );
};

export default function EditorContent(props: EditorContentProps) {
  const editorDivRef = useRef<HTMLDivElement>(null);
  const {
    capabilities,
    children,
    menuContainerRef,
    variant = { type: "author" },
    wrapperClassName,
  } = props;
  const resolvedCapabilities = resolveEditorCapabilities(capabilities);

  useOnClickOutside([editorDivRef, menuContainerRef], () => {}, "mousedown");

  const content =
    props.mode === "local" ? (
      <EditorInstance
        mode="local"
        isEditorEditable={isVariantEditable(variant)}
        editorDivRef={editorDivRef}
        wrapperClassName={wrapperClassName}
        userName="Anonymous Guest"
        initialContent={props.initialContent}
        commandRef={props.commandRef}
        mediaUploads={resolvedCapabilities.mediaUploads}
        shouldSetStoreEditor={props.shouldSetStoreEditor ?? true}
      >
        {children}
      </EditorInstance>
    ) : (
      <CollaborativeEditorContent
        documentId={props.documentId}
        editorDivRef={editorDivRef}
        mediaUploads={resolvedCapabilities.mediaUploads}
        shouldSetStoreEditor={props.shouldSetStoreEditor}
        variant={variant}
        wrapperClassName={wrapperClassName}
      >
        {children}
      </CollaborativeEditorContent>
    );

  return (
    <EditorCapabilitiesProvider value={capabilities}>
      {content}
    </EditorCapabilitiesProvider>
  );
}
