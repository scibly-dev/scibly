import { HocuspocusProvider } from "@hocuspocus/provider";
import { after } from "next/server";

import "server-only";
import { env } from "@/env";
import {
  courseMetadataRoom,
  type SyncEvent,
} from "@/shared/content/course/course-sync-events";
import { awaitSynced } from "@/shared/content/editor/collaboration/provider-handshake";

import { issueAuthorizedRoomToken } from "./issue-room-token";

type SyncUser = { id: string; name: string; username?: string | null };

const TIMEOUT_MS = 5000;

/**
 * Best effort, off the response path: `after` (rather than a floating promise)
 * keeps the socket alive past the response on a serverless runtime.
 */
export function broadcastCourseSync(
  user: SyncUser,
  courseId: string,
  ...events: SyncEvent[]
): void {
  after(() => deliver(user, courseId, events));
}

async function deliver(
  user: SyncUser,
  courseId: string,
  events: readonly SyncEvent[],
): Promise<void> {
  const room = courseMetadataRoom(courseId);
  let provider: HocuspocusProvider | undefined;
  try {
    const token = await issueAuthorizedRoomToken({
      room,
      kind: "course-metadata",
      user,
    });
    provider = new HocuspocusProvider({
      name: room,
      // The public URL is the browser's route, not the server's: in Docker this dials the service name.
      url: env.COLLAB_WS_URL ?? env.NEXT_PUBLIC_COLLAB_WS_URL,
      token,
    });
    await awaitSynced(provider, room, TIMEOUT_MS);
    for (const event of events) provider.sendStateless(JSON.stringify(event));
  } catch (error) {
    console.warn("[broadcastCourseSync] not delivered:", error);
  } finally {
    provider?.destroy();
  }
}
