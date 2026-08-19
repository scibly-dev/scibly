import {
  useHocuspocusConnectionStatus,
  useHocuspocusEvent,
  useHocuspocusProvider,
} from "@hocuspocus/provider-react";
import { Button } from "@scibly/ui/components/button";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  isTransientConnectionClose,
  mapCloseEventToErrorMessage,
} from "@/shared/content/editor/collaboration/connection-error";
import { EditorInstance } from "@/shared/content/editor/runtime/components/editor-instance";
import { LoadingState } from "@/shared/content/editor/runtime/components/loading-state";

type ConnectionBoundaryProps = {
  isEditorEditable: boolean;
  editorDivRef: React.RefObject<HTMLDivElement | null>;
  wrapperClassName?: string;
  userName: string;
  mediaUploads: "enabled" | "disabled";
  disableCursors?: boolean;
  children: React.ReactNode;
  shouldSetStoreEditor?: boolean;
};

export function ConnectionBoundary({
  isEditorEditable,
  editorDivRef,
  wrapperClassName,
  userName,
  mediaUploads,
  disableCursors,
  children,
  shouldSetStoreEditor,
}: ConnectionBoundaryProps) {
  const provider = useHocuspocusProvider();
  const status = useHocuspocusConnectionStatus();
  const [syncedEventFired, setSyncedEventFired] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnectionSlow, setIsConnectionSlow] = useState(false);

  useEffect(() => {
    if (status === "connecting" && !provider.isSynced && !syncedEventFired) {
      const timer = setTimeout(() => {
        setIsConnectionSlow(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnectionSlow(false);
    }
  }, [status, provider.isSynced, syncedEventFired]);

  useHocuspocusEvent("synced", () => {
    setSyncedEventFired(true);
    setConnectionError(null);
  });

  useHocuspocusEvent("authenticationFailed", ({ reason }) => {
    setConnectionError(
      reason ||
        "Authentication failed. Please check your permissions or log in again.",
    );
  });

  useHocuspocusEvent("close", ({ event }) => {
    if (!isTransientConnectionClose(event.code)) {
      setConnectionError(mapCloseEventToErrorMessage(event));
    }
  });

  const handleRetry = () => {
    setConnectionError(null);
    setIsConnectionSlow(false);
    provider.connect();
  };

  const isFullySynced = provider.isSynced || syncedEventFired;

  if (connectionError) {
    return (
      <div
        className={`border-destructive/20 flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border bg-neutral-50/50 p-6 text-center dark:bg-neutral-900/50 ${wrapperClassName ?? ""}`}
      >
        <AlertCircle className="text-destructive mb-2 h-8 w-8" />
        <p className="text-destructive text-sm font-medium">
          {connectionError}
        </p>
        <p className="text-muted-foreground mt-1 mb-4 text-xs">
          The collaborative server encountered an error.
        </p>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  if (status === "connecting" || !isFullySynced) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <LoadingState wrapperClassName={wrapperClassName} />
        {isConnectionSlow && (
          <p className="text-muted-foreground absolute bottom-12 mt-2 animate-pulse text-xs">
            Connecting to collaborative server is taking longer than expected.
            Please wait...
          </p>
        )}
      </div>
    );
  }

  return (
    <EditorInstance
      mode="collaborative"
      provider={provider}
      isEditorEditable={isEditorEditable}
      editorDivRef={editorDivRef}
      wrapperClassName={wrapperClassName}
      userName={userName}
      mediaUploads={mediaUploads}
      disableCursors={disableCursors}
      shouldSetStoreEditor={shouldSetStoreEditor}
    >
      {children}
    </EditorInstance>
  );
}
