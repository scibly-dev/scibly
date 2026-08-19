import * as Y from "yjs";

import { COLLAB_INITIAL_HTML_KEY, COLLAB_METADATA_MAP_NAME } from "./collab";

const RAW_HTML_LEADING_BYTE = 0x3c;

const isRawHtmlState = (state: Uint8Array): boolean =>
  state[0] === RAW_HTML_LEADING_BYTE;

const encodeHtmlAsYUpdate = (state: Uint8Array): Uint8Array | null => {
  try {
    const html = new TextDecoder().decode(state);
    const ydoc = new Y.Doc();
    ydoc
      .getMap<string>(COLLAB_METADATA_MAP_NAME)
      .set(COLLAB_INITIAL_HTML_KEY, html);
    return Y.encodeStateAsUpdate(ydoc);
  } catch (error) {
    console.error("[collab] Failed to decode raw HTML state:", error);
    return null;
  }
};

const isValidYUpdate = (state: Uint8Array): boolean => {
  try {
    Y.applyUpdate(new Y.Doc(), state);
    return true;
  } catch (error) {
    console.error("[collab] Invalid or corrupt Yjs document state:", error);
    return false;
  }
};

// DB-stored document state may still be legacy raw HTML rather than a Yjs update.
export const wrapRawHtmlState = (
  state: Uint8Array | null,
): Uint8Array | null => {
  if (!state || state.length === 0) return null;
  if (isRawHtmlState(state)) return encodeHtmlAsYUpdate(state);
  return isValidYUpdate(state) ? state : null;
};
