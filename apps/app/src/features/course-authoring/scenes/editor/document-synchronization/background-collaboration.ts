import { COLLAB_INITIAL_HTML_KEY, COLLAB_METADATA_MAP_NAME } from "@scibly/lib";
import { Editor } from "@tiptap/core";

import { vanillaApi } from "@/shared/api/trpc/client";
import { createSessionAwareRoomProvider } from "@/shared/content/editor/collaboration/create-room-provider";
import extensions from "@/shared/content/editor/extensions";
import { insertMediaNodeAtEnd } from "@/shared/content/editor/media/utils/media";
import {
  EDITOR_BLOCK_LIMIT,
  EDITOR_CHAR_LIMIT,
} from "@/shared/content/editor/runtime/editor-limits";

import {
  executeAppendContent,
  executeInsertContent,
} from "../ai-insertion/editor-commands";

interface BackgroundCollabOptions {
  sceneId: string;
  websocketProvider: any;
  timeoutMs?: number;
  deliveryTimeoutMs?: number;
  token?: string | (() => Promise<string>);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

type RoomProvider = ReturnType<typeof createSessionAwareRoomProvider>;

function waitForDelivery(
  provider: RoomProvider,
  sceneId: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!provider.hasUnsyncedChanges) {
      resolve();
      return;
    }

    const settleIfDelivered = () => {
      if (provider.hasUnsyncedChanges) return;
      cleanup();
      resolve();
    };

    const handleClose = ({ event }: { event: CloseEvent }) => {
      cleanup();
      reject(
        new Error(
          `Connection closed before the write to scene ${sceneId} was acknowledged: ${event?.reason || "Unknown reason"} (Code: ${event?.code})`,
        ),
      );
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Write to scene ${sceneId} was not acknowledged by the collab server within ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      provider.off("unsyncedChanges", settleIfDelivered);
      provider.off("close", handleClose);
    };

    provider.on("unsyncedChanges", settleIfDelivered);
    provider.on("close", handleClose);
  });
}

async function withBackgroundEditor<T>(
  {
    sceneId,
    websocketProvider,
    timeoutMs = 5000,
    deliveryTimeoutMs = 10000,
    token,
  }: BackgroundCollabOptions,
  action: (editor: Editor) => T | Promise<T>,
): Promise<T> {
  const resolvedToken =
    token ??
    (async () =>
      (
        await vanillaApi.collab.issueRoomToken.mutate({
          room: sceneId,
          kind: "scene-author",
        })
      ).token);
  const provider = createSessionAwareRoomProvider({
    name: sceneId,
    token: resolvedToken,
    websocketProvider,
  });

  provider.attach();

  try {
    await new Promise<void>((resolve, reject) => {
      const handleSynced = () => {
        cleanup();
        resolve();
      };

      const handleAuthFailed = ({ reason }: { reason: string }) => {
        cleanup();
        reject(
          new Error(`Authentication failed for scene ${sceneId}: ${reason}`),
        );
      };

      const handleClose = ({ event }: { event: CloseEvent }) => {
        cleanup();
        reject(
          new Error(
            `Connection closed for scene ${sceneId}: ${event?.reason || "Unknown reason"} (Code: ${event?.code})`,
          ),
        );
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Connection to collab server timed out for scene ${sceneId}`,
          ),
        );
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);
        provider.off("synced", handleSynced);
        provider.off("authenticationFailed", handleAuthFailed);
        provider.off("close", handleClose);
      };

      if (provider.isSynced) {
        cleanup();
        resolve();
      } else {
        provider.on("synced", handleSynced);
        provider.on("authenticationFailed", handleAuthFailed);
        provider.on("close", handleClose);
      }
    });

    const editor = new Editor({
      extensions: extensions({
        mode: "collaborative",
        charLimit: EDITOR_CHAR_LIMIT,
        blockLimit: EDITOR_BLOCK_LIMIT,
        userName: "scibly AI",
        mediaUploads: "enabled",
        collaboration: {
          ydoc: provider.document,
          provider,
          disableCursors: true,
        },
      }),
    });

    const metadata = provider.document.getMap<string>(COLLAB_METADATA_MAP_NAME);
    const initialHtml = metadata.get(COLLAB_INITIAL_HTML_KEY);
    const xmlFragment = provider.document.getXmlFragment("default");
    if (initialHtml && xmlFragment.length === 0) {
      editor.commands.setContent(initialHtml);
      metadata.delete(COLLAB_INITIAL_HTML_KEY);
    }

    try {
      const result = await action(editor);
      await waitForDelivery(provider, sceneId, deliveryTimeoutMs);
      return result;
    } finally {
      editor.destroy();
    }
  } finally {
    provider.destroy();
  }
}

export async function performBackgroundInsertion({
  sceneId,
  html,
  websocketProvider,
  token,
}: {
  sceneId: string;
  html: string;
  websocketProvider: any;
  token?: string;
}) {
  try {
    await withBackgroundEditor(
      { sceneId, websocketProvider, token },
      (editor) => {
        const result = executeInsertContent({
          editor,
          toolCall: { input: { html } },
        });
        if (!result.success) {
          throw new Error(result.error);
        }
      },
    );
    return { success: true };
  } catch (error) {
    console.error("[collab] Background insertion failed:", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function performBackgroundAppendContent({
  sceneId,
  html,
  websocketProvider,
  token,
}: {
  sceneId: string;
  html: string;
  websocketProvider: any;
  token?: string;
}) {
  try {
    await withBackgroundEditor(
      { sceneId, websocketProvider, token },
      (editor) => {
        const result = executeAppendContent({
          editor,
          toolCall: { input: { html } },
        });
        if (!result.success) {
          throw new Error(result.error);
        }
      },
    );
    return { success: true };
  } catch (error) {
    console.error("[collab] Background append failed:", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function performBackgroundInsertMediaNode({
  sceneId,
  url,
  alt,
  websocketProvider,
  token,
}: {
  sceneId: string;
  url: string;
  alt?: string;
  websocketProvider: any;
  token?: string;
}) {
  try {
    await withBackgroundEditor(
      { sceneId, websocketProvider, token },
      (editor) => {
        insertMediaNodeAtEnd(editor, url, alt);
      },
    );
    return { success: true };
  } catch (error) {
    console.error("[collab] Background media insert failed:", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function performBackgroundRead({
  sceneId,
  websocketProvider,
  token,
}: {
  sceneId: string;
  websocketProvider: any;
  token?: string;
}): Promise<{ html?: string; error?: string }> {
  try {
    const html = await withBackgroundEditor(
      { sceneId, websocketProvider, token },
      (editor) => {
        return editor.getHTML();
      },
    );
    return { html };
  } catch (error) {
    console.error("[collab] Background read failed:", error);

    return { error: errorMessage(error) };
  }
}
