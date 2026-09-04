import { describe, expect, it } from "vitest";

import {
  gradePracticeSubmission,
  isFieldCorrect,
} from "./grade-practice-submission";

const MANIFEST = {
  solution: {
    isPhishing: { value: true, points: 5 },
    reasons: { value: ["urgent", "link"], points: 5 },
    delay: { value: 3, points: 2, eps: 0.5 },
  },
  explain: "The sender domain is spoofed.",
};

describe("gradePracticeSubmission", () => {
  it("awards full points for an exact correct submission", () => {
    const result = gradePracticeSubmission(
      { isPhishing: true, reasons: ["link", "urgent"], delay: 3.2 },
      MANIFEST,
      10,
    );
    expect(result.totalSpEarned).toBe(10 + 5 + 5 + 2);
    expect(result.explanation).toBe(MANIFEST.explain);
  });

  it("zeroes a field that misses, keeps others scored", () => {
    const result = gradePracticeSubmission(
      { isPhishing: false, reasons: ["link", "urgent"], delay: 100 },
      MANIFEST,
      10,
    );
    const byId = Object.fromEntries(
      result.gradedFields.map((f) => [f.blockId, f.achievedPoints]),
    );
    expect(byId.isPhishing).toBe(0);
    expect(byId.reasons).toBe(5);
    expect(byId.delay).toBe(0);
    expect(result.totalSpEarned).toBe(10 + 0 + 5 + 0);
  });

  it("returns explanation only for an open-ended practice (no solution)", () => {
    const result = gradePracticeSubmission(
      { anything: "goes" },
      { solution: null, explain: "Nice work." },
      10,
    );
    expect(result.gradedFields).toEqual([]);
    expect(result.totalSpEarned).toBe(10);
    expect(result.explanation).toBe("Nice work.");
  });

  it("treats a missing/malformed work payload as all-zero, not a crash", () => {
    const result = gradePracticeSubmission(undefined, MANIFEST, 10);
    expect(result.gradedFields.every((f) => f.achievedPoints === 0)).toBe(true);
    expect(result.totalSpEarned).toBe(10);
  });

  it("matches an object value whatever order its keys arrive in", () => {
    const manifest = {
      solution: { at: { value: { x: 1, y: 2 }, points: 4 } },
      explain: null,
    };
    expect(
      gradePracticeSubmission({ at: { y: 2, x: 1 } }, manifest, 0)
        .totalSpEarned,
    ).toBe(4);
    expect(
      gradePracticeSubmission({ at: { x: 1, y: 3 } }, manifest, 0)
        .totalSpEarned,
    ).toBe(0);
  });

  it("compares arrays as multisets: order free, cardinality counted", () => {
    const manifest = {
      solution: { picks: { value: ["a", "b"], points: 4 } },
      explain: null,
    };
    const sp = (picks: unknown) =>
      gradePracticeSubmission({ picks }, manifest, 0).totalSpEarned;
    expect(sp(["b", "a"])).toBe(4);
    expect(sp(["a", "a"])).toBe(0);
    expect(sp(["a", "b", "b"])).toBe(0);
    expect(sp("a,b")).toBe(0);
  });
});

describe("isFieldCorrect", () => {
  it("is false for a zero-point field, however it was answered", () => {
    expect(isFieldCorrect({ achievedPoints: 0, maxPoints: 0 })).toBe(false);
  });

  it("needs the full points, not just some", () => {
    expect(isFieldCorrect({ achievedPoints: 5, maxPoints: 5 })).toBe(true);
    expect(isFieldCorrect({ achievedPoints: 2, maxPoints: 5 })).toBe(false);
  });
});
