"use client";

import type { HocuspocusProviderWebsocket } from "@hocuspocus/provider";

import { useEffect, useRef, useState } from "react";

import { createSessionAwareRoomProvider } from "@/shared/content/editor/collaboration/create-room-provider";

type RoomToken = string | (() => string) | (() => Promise<string>) | null;

export function useSessionAwareProvider({
  name,
  token,
  websocketProvider,
}: {
  name: string;
  token: RoomToken | (() => Promise<string>);
  websocketProvider: HocuspocusProviderWebsocket;
}) {
  const [provider, setProvider] = useState(() =>
    createSessionAwareRoomProvider({
      name,
      token,
      websocketProvider,
    }),
  );
  const destroyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (
      provider.configuration.name !== name ||
      provider.configuration.websocketProvider !== websocketProvider ||
      provider.configuration.token !== token
    ) {
      provider.destroy();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvider(
        createSessionAwareRoomProvider({
          name,
          token,
          websocketProvider,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, token, websocketProvider]);

  useEffect(() => {
    if (destroyTimeoutRef.current) {
      clearTimeout(destroyTimeoutRef.current);
      destroyTimeoutRef.current = null;
    }

    provider.attach();

    return () => {
      destroyTimeoutRef.current = setTimeout(() => {
        provider.destroy();
      }, 0);
    };
  }, [provider]);

  return provider;
}
