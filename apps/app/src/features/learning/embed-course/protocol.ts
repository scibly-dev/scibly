// `public/embed/v1.js` has no build step to import through and hard-codes the
// four constants below; protocol.test.ts fails if the two drift apart.

import { z } from "zod";

import { type HostFrameRect } from "./viewport";

export const EMBED_PROTOCOL_VERSION = 1;

export const EMBED_MESSAGE_SOURCE = "scibly-embed";

export const EMBED_HOST_MESSAGE_SOURCE = "scibly-embed-host";

export const EMBED_FRAME_ATTRIBUTE = "data-scibly-embed";

export const EMBED_SCRIPT_PATH = "/embed/v1.js";

export type EmbedFrameMessage =
  | {
      type: "resize";
      height: number;
      /** How long the host may take to reach that height; absent means at once,
       * which is why it needed no version 2. */
      transitionMs?: number;
    }
  | { type: "scroll-into-view" };

// Targets `"*"` when the host withheld its referrer: everything we send is a
// height or a scroll request the parent could measure for itself anyway.
export function postToHost(
  message: EmbedFrameMessage,
  hostOrigin: string | null,
): void {
  window.parent.postMessage(
    {
      source: EMBED_MESSAGE_SOURCE,
      version: EMBED_PROTOCOL_VERSION,
      ...message,
    },
    hostOrigin ?? "*",
  );
}

// Finite, not merely numeric: these become CSS lengths, and `NaNpx` would send
// every `var()` consumer to its fallback instead of failing loudly.
const viewportMessage = z.object({
  source: z.literal(EMBED_HOST_MESSAGE_SOURCE),
  version: z.literal(EMBED_PROTOCOL_VERSION),
  type: z.literal("viewport"),
  top: z.number().finite(),
  height: z.number().finite(),
  viewportHeight: z.number().finite(),
});

export function parseViewportMessage(data: unknown): HostFrameRect | null {
  const parsed = viewportMessage.safeParse(data);
  if (!parsed.success) return null;
  const { top, height, viewportHeight } = parsed.data;
  return { top, height, viewportHeight };
}

// The trust boundary of the whole embed: what survives here becomes the
// height the host script applies to a customer's page.
export function viewportFromHost(
  event: MessageEvent,
  hostOrigin: string | null,
): HostFrameRect | null {
  if (event.source !== window.parent) return null;
  if (hostOrigin && event.origin !== hostOrigin) return null;
  return parseViewportMessage(event.data);
}
