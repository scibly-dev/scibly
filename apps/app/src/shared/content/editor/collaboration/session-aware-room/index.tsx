"use client";

import type { CollaborationRoomKind } from "@/shared/content/editor/collaboration/contracts";

import {
  HocuspocusContext,
  HocuspocusRoomContext,
} from "@hocuspocus/provider-react";
import React, { useCallback, useContext, useMemo } from "react";

import { vanillaApi } from "@/shared/api/trpc/client";
import { useSessionAwareProvider } from "@/shared/content/editor/collaboration/session-aware-room/use-session-aware-provider";

interface SessionAwareRoomProps {
  name: string;
  kind: CollaborationRoomKind;
  token?: string | (() => string) | (() => Promise<string>) | null;
  children: React.ReactNode;
}

/**
 * Drop-in `HocuspocusRoom` replacement that suffixes the room name with a
 * session id, avoiding the "Cannot attach two providers" error from Strict
 * Mode's double-mount.
 */
export function SessionAwareRoom({
  name,
  kind,
  token,
  children,
}: SessionAwareRoomProps) {
  const hocuspocusContext = useContext(HocuspocusContext);

  if (!hocuspocusContext) {
    throw new Error(
      "SessionAwareRoom must be used within a HocuspocusProviderWebsocketComponent",
    );
  }

  const { websocketProvider } = hocuspocusContext;
  const issueToken = useCallback(
    async () =>
      (
        await vanillaApi.collab.issueRoomToken.mutate({
          room: name,
          kind,
        })
      ).token,
    [kind, name],
  );
  const provider = useSessionAwareProvider({
    name,
    token: token ?? issueToken,
    websocketProvider,
  });
  const contextValue = useMemo(() => ({ provider }), [provider]);

  return (
    <HocuspocusRoomContext.Provider value={contextValue}>
      {children}
    </HocuspocusRoomContext.Provider>
  );
}
