import type { HocuspocusProvider as HocuspocusProviderType } from "@hocuspocus/provider";

import { HocuspocusProvider } from "@hocuspocus/provider";

type SharedWebsocketProvider =
  HocuspocusProviderType["configuration"]["websocketProvider"];

export type RoomToken =
  | string
  | (() => string)
  | (() => Promise<string>)
  | null;

export function createSessionAwareRoomProvider({
  name,
  token,
  websocketProvider,
}: {
  name: string;
  token: RoomToken;
  websocketProvider: SharedWebsocketProvider;
}) {
  return new HocuspocusProvider({
    name,
    token,
    websocketProvider,
    sessionAwareness: true,
  });
}
