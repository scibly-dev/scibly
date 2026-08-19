import { z } from "zod";

const imageInsertTargetSchema = z.object({
  sceneId: z.string(),
  sceneTitle: z.string(),
  lessonId: z.string(),
  lessonTitle: z.string(),
});

export type ImageInsertTarget = z.infer<typeof imageInsertTargetSchema>;

const storeSchema = z.record(z.string(), imageInsertTargetSchema).catch({});

const STORAGE_KEY = "scibly:notebook-image-insert-target";

function readStore(): Record<string, ImageInsertTarget> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return storeSchema.parse(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, ImageInsertTarget>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function getStoredImageInsertTarget(
  notebookId: string,
): ImageInsertTarget | null {
  return readStore()[notebookId] ?? null;
}

export function setStoredImageInsertTarget(
  notebookId: string,
  target: ImageInsertTarget,
): void {
  const store = readStore();
  store[notebookId] = target;
  writeStore(store);
}

export function clearStoredImageInsertTarget(notebookId: string): void {
  const store = readStore();
  delete store[notebookId];
  writeStore(store);
}
