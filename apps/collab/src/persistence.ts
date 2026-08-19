import { db } from "@scibly/db";
import { CollabDocument } from "@scibly/lib";

import { config } from "./config.js";

// Global map to hold the latest state for each dirty document
const dirtyDocuments = new Map<string, Uint8Array>();

let flushTimer: NodeJS.Timeout | null = null;

export function scheduleDbFlush(documentName: string, state: Uint8Array) {
  dirtyDocuments.set(documentName, new Uint8Array(state));

  if (!flushTimer) {
    flushTimer = setInterval(flushAllDirtyDocuments, config.flushIntervalMs);
  }
}

async function flushAllDirtyDocuments() {
  if (dirtyDocuments.size === 0) return;

  const entries = Array.from(dirtyDocuments.entries());
  dirtyDocuments.clear();

  const promises = entries.map(async ([documentName, state]) => {
    try {
      const { sceneId } = CollabDocument.parse(documentName);

      if (config.nodeEnv === "development") {
        const sizeKb = (state.byteLength / 1024).toFixed(2);
        console.log(`[collab] Flushing ${documentName} to DB: ${sizeKb} KB`);
      }

      await db.scene.updateMany({
        where: { id: sceneId },
        data: { documentState: Buffer.from(state) },
      });
    } catch (err) {
      console.error(`[collab] DB flush error for ${documentName}:`, err);

      if (!dirtyDocuments.has(documentName)) {
        dirtyDocuments.set(documentName, state);
      }
    }
  });

  await Promise.allSettled(promises);
}

export async function shutdownPersistence() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  if (dirtyDocuments.size > 0) {
    console.log(
      `[collab] Flushing ${dirtyDocuments.size} remaining documents before shutdown...`,
    );
    await flushAllDirtyDocuments();
  }
}
