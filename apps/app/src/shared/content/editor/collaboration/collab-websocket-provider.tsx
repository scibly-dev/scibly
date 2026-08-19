"use client";

import { HocuspocusProviderWebsocketComponent } from "@hocuspocus/provider-react";
import { resolveClientEnvUrl } from "@scibly/lib";

import { env } from "@/env";

const collabWsUrl = resolveClientEnvUrl(env.NEXT_PUBLIC_COLLAB_WS_URL);

export function CollabWebsocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HocuspocusProviderWebsocketComponent url={collabWsUrl}>
      {children}
    </HocuspocusProviderWebsocketComponent>
  );
}
