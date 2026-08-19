import { createClientId } from "@/lib/utils/create-client-id";

export const ANONYMOUS_ID_KEY = "scibly_anonymous_id";

// Holds the identity for the page's lifetime when storage is unavailable —
// inside a third-party frame, access can be denied or partitioned away.
let ephemeralId: string | null = null;

function readStoredId(): string | null {
  try {
    return window.localStorage.getItem(ANONYMOUS_ID_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(id: string): void {
  try {
    window.localStorage.setItem(ANONYMOUS_ID_KEY, id);
  } catch {}
}

export interface AnonymousIdentity {
  id: string;

  persisted: boolean;
}

// Never throws: the caller has no better answer than "carry on unidentified".
export function resolveAnonymousId(): AnonymousIdentity {
  const stored = readStoredId();
  if (stored) return { id: stored, persisted: true };
  if (ephemeralId) return { id: ephemeralId, persisted: false };

  const id = createClientId();
  writeStoredId(id);
  ephemeralId = id;

  return { id, persisted: readStoredId() === id };
}
