import { describe, expect, it } from "vitest";

import {
  assemblePracticeDocument,
  toPracticeGrade,
} from "./assemble-practice-document";

const SDK = { mode: "attempt" as const, previous: null };

describe("assemblePracticeDocument", () => {
  it("wraps a bare body fragment in a full document", () => {
    const doc = assemblePracticeDocument("<div>hi</div>", SDK);
    expect(doc).toContain("<!DOCTYPE html>");
    expect(doc).toContain("window.scibly");
    expect(doc).toContain("<div>hi</div>");
    expect(doc.indexOf("window.scibly")).toBeLessThan(
      doc.indexOf("<div>hi</div>"),
    );
  });

  it("injects right after an existing <head> instead of double-wrapping", () => {
    const fragment =
      "<html><head><title>x</title></head><body>hi</body></html>";
    const doc = assemblePracticeDocument(fragment, SDK);
    expect(doc.match(/<html/gi)).toHaveLength(1);
    expect(doc.indexOf("window.scibly")).toBeLessThan(doc.indexOf("<title>"));
  });

  it("escapes </script> inside injected SDK data", () => {
    const doc = assemblePracticeDocument("<div>hi</div>", {
      mode: "review",
      previous: { work: { note: "</script><script>evil()" }, grade: null },
    });
    expect(doc).not.toContain("</script><script>evil()");
  });

  it("gives an <html> fragment with no <head> one of its own", () => {
    const doc = assemblePracticeDocument("<html><body>hi</body></html>", SDK);
    expect(doc.match(/<head/gi)).toHaveLength(1);
    expect(doc.match(/<html/gi)).toHaveLength(1);
    expect(doc.indexOf("window.scibly")).toBeLessThan(doc.indexOf("<body>"));
  });

  it("injects CSP, then tokens, then the SDK, then the height bridge", () => {
    const doc = assemblePracticeDocument("<div>hi</div>", SDK);
    const order = [
      "Content-Security-Policy",
      "--color-ink",
      "window.scibly",
      "scibly:height",
    ].map((needle) => doc.indexOf(needle));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((at) => at >= 0)).toBe(true);
  });

  it("keeps the frame from navigating itself out of the sandbox", () => {
    const doc = assemblePracticeDocument("<div>hi</div>", SDK);
    expect(doc).toContain("default-src 'none'");
    expect(doc).toContain("form-action 'none'");
  });

  it("exposes onGraded to the fragment", () => {
    const doc = assemblePracticeDocument("<div>hi</div>", SDK);
    expect(doc).toContain("onGraded");
    expect(doc).toContain("scibly:graded");
  });
});

describe("toPracticeGrade", () => {
  it("keys fields by id and only counts a full-credit field correct", () => {
    expect(
      toPracticeGrade([
        {
          blockId: "order",
          achievedPoints: 10,
          maxPoints: 10,
          spEarned: 10,
          correctAnswer: "a > b",
        },
        { blockId: "count", achievedPoints: 2, maxPoints: 5, spEarned: 2 },
      ]),
    ).toEqual({
      sp: 12,
      fields: {
        order: {
          correct: true,
          expected: "a > b",
          points: 10,
          maxPoints: 10,
        },
        count: {
          correct: false,
          expected: undefined,
          points: 2,
          maxPoints: 5,
        },
      },
    });
  });
});

describe("the injected SDK's self-test", () => {
  type Listener = (event: { source: unknown; data: unknown }) => void;
  type SdkWindow = {
    __sciblySelfTest: unknown;
    addEventListener: (type: string, fn: Listener) => void;
    scibly?: { submit: (work: unknown) => void };
  };

  function runSdk(selfTest?: unknown) {
    const source = assemblePracticeDocument("<div>hi</div>", SDK).match(
      /<script>(\s*window\.scibly[\s\S]*?)<\/script>/,
    )![1]!;
    const posted: unknown[] = [];
    const listeners: Listener[] = [];
    const parent = { postMessage: (data: unknown) => posted.push(data) };
    const window: SdkWindow = {
      __sciblySelfTest: selfTest,
      addEventListener: (type, fn) => {
        if (type === "message") listeners.push(fn);
      },
    };
    new Function("window", "parent", source)(window, parent);
    return {
      scibly: window.scibly!,
      posted,
      ask: () =>
        listeners.forEach((fn) =>
          fn({ source: parent, data: { type: "scibly:self-test" } }),
        ),
    };
  }

  it("submits the self-test payload down the app's own submit path", () => {
    const sdk = runSdk(() => ({ answer: 42 }));
    sdk.ask();
    expect(sdk.posted).toEqual([
      { type: "scibly:submit", work: { answer: 42 } },
    ]);
  });

  it("runs after a manual play instead of needing a restart first", () => {
    const sdk = runSdk(() => ({ answer: 42 }));
    sdk.scibly.submit({ answer: 1 });
    sdk.scibly.submit({ answer: 2 });
    sdk.ask();
    expect(sdk.posted).toEqual([
      { type: "scibly:submit", work: { answer: 1 } },
      { type: "scibly:submit", work: { answer: 42 } },
    ]);
  });

  it("reports an app that never defined the hook", () => {
    const sdk = runSdk(undefined);
    sdk.ask();
    expect(sdk.posted).toEqual([
      { type: "scibly:self-test-failed", code: "missing" },
    ]);
  });

  it("reports an app whose hook throws instead of hanging on it", () => {
    const sdk = runSdk(() => {
      throw new Error("no board yet");
    });
    sdk.ask();
    expect(sdk.posted).toEqual([
      {
        type: "scibly:self-test-failed",
        code: "threw",
        detail: "Error: no board yet",
      },
    ]);
  });
});
