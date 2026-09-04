import { describe, expect, it } from "vitest";

import { parsePracticeMessage } from "./parse-practice-message";

describe("parsePracticeMessage", () => {
  it("clamps height into the range the iframe is allowed to take", () => {
    const px = (value: unknown) =>
      parsePracticeMessage({ type: "scibly:height", px: value });
    expect(px(640)).toEqual({ type: "height", px: 640 });
    expect(px(10)).toEqual({ type: "height", px: 200 });
    expect(px(99_999)).toEqual({ type: "height", px: 2000 });
    expect(px(200)).toEqual({ type: "height", px: 200 });
    expect(px(2000)).toEqual({ type: "height", px: 2000 });
  });

  it("passes any submit payload through, and never `undefined`", () => {
    expect(
      parsePracticeMessage({ type: "scibly:submit", work: { a: [1, "b"] } }),
    ).toEqual({ type: "submit", work: { a: [1, "b"] } });
    expect(parsePracticeMessage({ type: "scibly:submit" })).toEqual({
      type: "submit",
      work: null,
    });
  });

  it("carries a self-test failure back to the author as a code", () => {
    expect(
      parsePracticeMessage({
        type: "scibly:self-test-failed",
        code: "missing",
      }),
    ).toEqual({ type: "self-test-failed", code: "missing", detail: null });
    expect(
      parsePracticeMessage({
        type: "scibly:self-test-failed",
        code: "threw",
        detail: "Error: no board yet",
      }),
    ).toEqual({
      type: "self-test-failed",
      code: "threw",
      detail: "Error: no board yet",
    });
  });

  it("rejects anything the frame is not supposed to be able to say", () => {
    for (const data of [
      null,
      undefined,
      "scibly:height",
      42,
      {},
      { type: "scibly:resize" },
      { type: "scibly:height" },
      { type: "scibly:height", px: "640" },
      { type: "scibly:height", px: Number.NaN },
      { type: "scibly:self-test-failed" },
      { type: "scibly:self-test-failed", code: "exploded" },
    ])
      expect(parsePracticeMessage(data)).toBeNull();
  });
});
