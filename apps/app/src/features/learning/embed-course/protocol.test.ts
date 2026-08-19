import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  EMBED_FRAME_ATTRIBUTE,
  EMBED_HOST_MESSAGE_SOURCE,
  EMBED_MESSAGE_SOURCE,
  EMBED_PROTOCOL_VERSION,
  parseViewportMessage,
  viewportFromHost,
} from "./protocol";

const RECT = { top: 0, height: 600, viewportHeight: 900 };

interface MessageOverrides {
  source?: unknown;
  version?: unknown;
  type?: unknown;
  top?: unknown;
  height?: unknown;
  viewportHeight?: unknown;
}

const message = (overrides: MessageOverrides = {}) => ({
  source: EMBED_HOST_MESSAGE_SOURCE,
  version: EMBED_PROTOCOL_VERSION,
  type: "viewport",
  ...RECT,
  ...overrides,
});

describe("host message validation", () => {
  it("reads the rectangle out of our own host script's message", () => {
    expect(parseViewportMessage(message())).toEqual(RECT);
  });

  it("refuses anything that is not this protocol's viewport message", () => {
    for (const candidate of [
      null,
      undefined,
      "viewport",
      42,
      {},
      message({ source: EMBED_MESSAGE_SOURCE }),
      message({ source: "other-embed-host" }),
      message({ version: 2 }),
      message({ version: "1" }),
      message({ type: "resize" }),
      message({ top: "0" }),
      message({ height: null }),
      { ...message(), viewportHeight: undefined },
    ]) {
      expect(parseViewportMessage(candidate)).toBeNull();
    }
  });

  it("refuses a number that cannot be a CSS length", () => {
    for (const value of [Number.NaN, Infinity, -Infinity]) {
      expect(parseViewportMessage(message({ top: value }))).toBeNull();
      expect(parseViewportMessage(message({ height: value }))).toBeNull();
      expect(
        parseViewportMessage(message({ viewportHeight: value })),
      ).toBeNull();
    }
  });

  it("takes an implausible magnitude at its word", () => {
    expect(parseViewportMessage(message({ top: -5000 }))?.top).toBe(-5000);
    expect(parseViewportMessage(message({ height: 1e12 }))?.height).toBe(1e12);
  });
});

describe("who is believed", () => {
  const event = (init: MessageEventInit) => new MessageEvent("message", init);

  it("believes the parent frame at the host's origin", () => {
    expect(
      viewportFromHost(
        event({
          data: message(),
          origin: "https://host.example",
          source: window.parent,
        }),
        "https://host.example",
      ),
    ).toEqual(RECT);
  });

  it("refuses a sender that is not the parent, whatever origin it claims", () => {
    for (const hostOrigin of ["https://host.example", null]) {
      expect(
        viewportFromHost(
          event({ data: message(), origin: hostOrigin ?? "", source: null }),
          hostOrigin,
        ),
      ).toBeNull();
    }
  });

  it("refuses another origin once the host's is known", () => {
    expect(
      viewportFromHost(
        event({
          data: message(),
          origin: "https://evil.example",
          source: window.parent,
        }),
        "https://host.example",
      ),
    ).toBeNull();
  });

  it("still believes the parent when the host withheld its referrer", () => {
    expect(
      viewportFromHost(
        event({
          data: message(),
          origin: "https://host.example",
          source: window.parent,
        }),
        null,
      ),
    ).toEqual(RECT);
  });
});

describe("host script alignment", () => {
  const script = readFileSync("public/embed/v1.js", "utf8");

  it("spells the protocol the same way as the script that speaks it", () => {
    expect(script).toContain(`var VERSION = ${EMBED_PROTOCOL_VERSION};`);
    expect(script).toContain(`var FRAME_SOURCE = "${EMBED_MESSAGE_SOURCE}";`);
    expect(script).toContain(
      `var HOST_SOURCE = "${EMBED_HOST_MESSAGE_SOURCE}";`,
    );
    expect(script).toContain(
      `var SELECTOR = "iframe[${EMBED_FRAME_ATTRIBUTE}]";`,
    );
  });
});
