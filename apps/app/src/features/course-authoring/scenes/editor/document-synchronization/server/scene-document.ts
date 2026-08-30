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

import {
  normalizeAuthorDocument,
  parseSceneHtml,
  sceneHtml,
  SceneHtmlError,
  sceneSchema,
} from "./scene-html";

/**
 * Reads and writes go through the scene's collab room, never
 * `scene.documentState` directly: while an author has the scene open the row is
 * a stale flush target and a direct read or write is a lost update — hence
 * deliberately no fallback when the collab server is unreachable.
 */

export type SceneWriteMode = "replace" | "append";

/** The author a scene read or write is attributed to; agents act as a person,
 * never as a machine principal
 * (docs/adr/0004-external-agents-act-as-the-author.md). */
export type SceneUser = { id: string; name: string; username?: string | null };

type SceneRoom = {
  sceneId: string;
  user?: SceneUser;
  url?: string;
  timeoutMs?: number;
};

/** `refused` marks content the editor would not accept, as opposed to a write
 * that never reached the room — the caller reports the two differently. */
type Refused = { success: false; error: string; refused: boolean };

export async function writeSceneHtml({
  sceneId,
  html,
  mode = "replace",
  user,
  url,
  timeoutMs,
  deliveryTimeoutMs = 10000,
}: SceneRoom & {
  html: string;
  mode?: SceneWriteMode;
  deliveryTimeoutMs?: number;
}): Promise<{ success: true } | Refused> {
  try {
    // Replacing with nothing empties the scene, which is a legitimate edit;
    // appending nothing is a mistake worth naming.
    if (mode === "append" && !html) {
      throw new SceneHtmlError("HTML content is empty or missing.");
    }

    // Replacement content stands on its own so it is refused before a socket
    // opens; appended content can only be checked against the document.
    const replacement = mode === "replace" ? parseSceneHtml(html) : undefined;

    return await inSceneRoom(
      { sceneId, user, url, timeoutMs },
      async (provider) => {
        const document = provider.document;
        const fragment = document.getXmlFragment("default");
        hydrateLegacyHtml(document, fragment);

        const current = yXmlFragmentToProsemirror(sceneSchema(), fragment);
        const next = normalizeAuthorDocument(
          current,
          replacement ??
            current.copy(
              current.content.append(parseSceneHtml(html, current).content),
            ),
        );

        // One transaction so collaborators see the write arrive whole.
        document.transact(() => prosemirrorToYXmlFragment(next, fragment));

        await awaitDelivered(provider, sceneId, deliveryTimeoutMs);
        return { success: true };
      },
    );
  } catch (error) {
    return failed(error);
  }
}

export async function readSceneHtml({
  sceneId,
  user,
  url,
  timeoutMs,
}: SceneRoom): Promise<{ success: true; html: string } | Refused> {
  try {
    return await inSceneRoom({ sceneId, user, url, timeoutMs }, (provider) => {
      const document = provider.document;
      const fragment = document.getXmlFragment("default");
      // Legacy HTML stays parked on a read — hydrating would hand the room a
      // change with no delivery to wait on; the first writer materializes it.
      if (fragment.length === 0) {
        return { success: true, html: legacyHtml(document) ?? "" };
      }
      return {
        success: true,
        html: sceneHtml(yXmlFragmentToProsemirror(sceneSchema(), fragment)),
      };
    });
  } catch (error) {
    return failed(error);
  }
}

/** The token is minted here rather than from the provider's token callback so
 * a refusal reaches the caller as itself instead of wrapped in a socket error. */
async function inSceneRoom<T>(
  { sceneId, user, url, timeoutMs = 5000 }: SceneRoom,
  inRoom: (provider: HocuspocusProvider) => Promise<T> | T,
): Promise<T> {
  // The same room policy the browser goes through, so a server-side caller
  // gets exactly the access the author it acts for already has — and browsers
  // gain nothing, since this never becomes a reachable procedure.
  const roomToken = await issueAuthorizedRoomToken({
    room: sceneId,
    kind: "scene-author",
    user,
  });

  const provider = new HocuspocusProvider({
    name: sceneId,
    // The public URL is the browser's route to the collab server, not
    // necessarily the server's — in Docker the app dials the service name.
    url: url ?? env.COLLAB_WS_URL ?? env.NEXT_PUBLIC_COLLAB_WS_URL,
    token: roomToken,
  });

  try {
    await awaitSynced(provider, sceneId, timeoutMs);
    return await inRoom(provider);
  } finally {
    provider.destroy();
  }
}

function failed(error: unknown): Refused {
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
    refused: error instanceof SceneHtmlError,
  };
}

function legacyHtml(document: HocuspocusProvider["document"]) {
  return document
    .getMap<string>(COLLAB_METADATA_MAP_NAME)
    .get(COLLAB_INITIAL_HTML_KEY);
}

/** Scenes saved before collaborative editing park raw HTML in the document
 * metadata; whoever opens the room first materializes it or it is lost. */
function hydrateLegacyHtml(
  document: HocuspocusProvider["document"],
  fragment: ReturnType<HocuspocusProvider["document"]["getXmlFragment"]>,
) {
  const initialHtml = legacyHtml(document);
  if (!initialHtml || fragment.length > 0) return;

  const node = parseSceneHtml(initialHtml);
  document.transact(() => {
    prosemirrorToYXmlFragment(node, fragment);
    document
      .getMap<string>(COLLAB_METADATA_MAP_NAME)
      .delete(COLLAB_INITIAL_HTML_KEY);
  });
}
