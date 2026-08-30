import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { COLLAB_INITIAL_HTML_KEY, COLLAB_METADATA_MAP_NAME } from "@scibly/lib";
import {
  prosemirrorToYXmlFragment,
  yXmlFragmentToProsemirror,
} from "@tiptap/y-tiptap";

import "server-only";
import { env } from "@/env";
import { issueAuthorizedRoomToken } from "@/features/course-authoring/collaboration/server/issue-room-token";
import {
  awaitDelivered,
  awaitSynced,
} from "@/shared/content/editor/collaboration/provider-handshake";

import { parseSceneHtml, sceneSchema } from "./scene-html";

/**
 * Writes scene content from the server, by joining the scene's collab room the
 * same way the editor does.
 *
 * Writing `scene.documentState` directly instead would be a lost update: while
 * an author has the scene open the live document is authoritative and the row
 * is a stale flush target, so a direct write is silently discarded on the next
 * flush — or discards the author's work. Merging through the collab server is
 * the only correct write path, so there is deliberately no fallback here for
 * when the collab server is unreachable.
 */

type SceneWriteMode = "replace" | "append";

type SceneWriter = {
  sceneId: string;
  html: string;
  mode?: SceneWriteMode;
  /** The author the write is attributed to; agents act as a person, never as a
   * machine principal (docs/adr/0004-external-agents-act-as-the-author.md). */
  user?: { id: string; name: string; username?: string | null };
  url?: string;
  timeoutMs?: number;
  deliveryTimeoutMs?: number;
};

export async function writeSceneHtml({
  sceneId,
  html,
  mode = "replace",
  user,
  url,
  timeoutMs = 5000,
  deliveryTimeoutMs = 10000,
}: SceneWriter): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Replacement content stands on its own, so it is refused before a socket
    // is opened. Appended content can only be checked against what is already
    // in the document, which means connecting first.
    const replacement = mode === "replace" ? parseSceneHtml(html) : undefined;

    // The same room policy the browser goes through, so a server-side caller
    // gets exactly the access the author it acts for already has — and browsers
    // gain nothing, since this never becomes a reachable procedure. Minted here
    // rather than from the provider's token callback so a refusal reaches the
    // caller as itself instead of wrapped in a socket error.
    const roomToken = await issueAuthorizedRoomToken({
      room: sceneId,
      kind: "scene-author",
      user,
    });

    const provider = new HocuspocusProvider({
      name: sceneId,
      url: collabUrl(url),
      token: roomToken,
    });

    try {
      await awaitSynced(provider, sceneId, timeoutMs);

      const document = provider.document;
      const fragment = document.getXmlFragment("default");
      hydrateLegacyHtml(document, fragment);

      const next =
        replacement ??
        appended(yXmlFragmentToProsemirror(sceneSchema(), fragment), html);

      // One transaction so collaborators see the write arrive whole.
      document.transact(() => prosemirrorToYXmlFragment(next, fragment));

      await awaitDelivered(provider, sceneId, deliveryTimeoutMs);
      return { success: true };
    } finally {
      provider.destroy();
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function collabUrl(override?: string): string {
  // The public URL is the browser's route to the collab server, which is not
  // necessarily the server's — in Docker the app dials the service name.
  return override ?? env.COLLAB_WS_URL ?? env.NEXT_PUBLIC_COLLAB_WS_URL;
}

/**
 * Scenes last saved before collaborative editing arrive as raw HTML parked in
 * the document metadata, and whoever opens the room first is responsible for
 * materializing it. Skipping this would silently discard the scene's content.
 */
function hydrateLegacyHtml(
  document: HocuspocusProvider["document"],
  fragment: ReturnType<HocuspocusProvider["document"]["getXmlFragment"]>,
) {
  const metadata = document.getMap<string>(COLLAB_METADATA_MAP_NAME);
  const initialHtml = metadata.get(COLLAB_INITIAL_HTML_KEY);
  if (!initialHtml || fragment.length > 0) return;

  const node = parseSceneHtml(initialHtml);
  document.transact(() => {
    prosemirrorToYXmlFragment(node, fragment);
    metadata.delete(COLLAB_INITIAL_HTML_KEY);
  });
}

function appended(existing: ProseMirrorNode, html: string): ProseMirrorNode {
  const addition = parseSceneHtml(html, existing);
  return existing.copy(existing.content.append(addition.content));
}
