import React from "react";

import { CollabWebsocketProvider } from "@/shared/content/editor/collaboration/collab-websocket-provider";

export default function NotebooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CollabWebsocketProvider>{children}</CollabWebsocketProvider>;
}
