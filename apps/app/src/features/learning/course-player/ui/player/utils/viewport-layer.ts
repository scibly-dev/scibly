// Read by the embed's auto-resize logic to size an iframe to the screen
// rather than to an out-of-flow document that measures as empty.
const PLAYER_VIEWPORT_ATTR = "data-player-viewport-layer";

export const PLAYER_VIEWPORT_LAYER = {
  [PLAYER_VIEWPORT_ATTR]: "",
} as const;

export const PLAYER_VIEWPORT_LAYER_SELECTOR = `[${PLAYER_VIEWPORT_ATTR}]`;

// Written only by the embed's viewport sync and read as
// `var(--player-vh, 1vh)`, so non-embed pages fall back to plain `vh`.
export const PLAYER_VIEWPORT_UNIT = "--player-vh";
