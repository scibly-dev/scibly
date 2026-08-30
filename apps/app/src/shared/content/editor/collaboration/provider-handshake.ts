import type { HocuspocusProvider } from "@hocuspocus/provider";

// A write that reports success on a dropped connection is silent data loss,
// so a close or timeout rejects rather than resolves.

type CloseDetail = { event?: { reason?: string; code?: number } };

function closeReason({ event }: CloseDetail) {
  return `${event?.reason || "Unknown reason"} (Code: ${event?.code})`;
}

/** Resolves once the provider holds the server's copy of the document. */
export function awaitSynced(
  provider: Pick<HocuspocusProvider, "on" | "off" | "isSynced">,
  sceneId: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
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

    const handleClose = (detail: CloseDetail) => {
      cleanup();
      reject(
        new Error(
          `Connection closed for scene ${sceneId}: ${closeReason(detail)}`,
        ),
      );
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(`Connection to collab server timed out for scene ${sceneId}`),
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
      return;
    }

    provider.on("synced", handleSynced);
    provider.on("authenticationFailed", handleAuthFailed);
    provider.on("close", handleClose);
  });
}

/** Resolves once the server has acknowledged everything written locally. */
export function awaitDelivered(
  provider: Pick<HocuspocusProvider, "on" | "off" | "hasUnsyncedChanges">,
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

    const handleClose = (detail: CloseDetail) => {
      cleanup();
      reject(
        new Error(
          `Connection closed before the write to scene ${sceneId} was acknowledged: ${closeReason(detail)}`,
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
