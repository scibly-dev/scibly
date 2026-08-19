import { describe, expect, it } from "vitest";

import { deriveTierState, getTierColor } from "./score-tier-section";

describe("a question worth zero points does not read as correct", () => {
  it("an achieved/max of 0/0 is not the correct tier", () => {
    expect(deriveTierState(0, 0).isCorrect).toBe(false);
  });

  it("an achieved/max of 0/0 renders the zero tier color, not the correct one", () => {
    const { isCorrect, isZero } = deriveTierState(0, 0);
    expect(getTierColor(isCorrect, isZero)).toContain("red");
  });
});

describe("a question worth something is graded normally, unaffected by the exclusion", () => {
  it("achieved equal to a positive max is the correct tier", () => {
    expect(deriveTierState(5, 5).isCorrect).toBe(true);
  });

  it("a correct answer renders the correct tier color", () => {
    const { isCorrect, isZero } = deriveTierState(5, 5);
    expect(getTierColor(isCorrect, isZero)).toContain("green");
  });

  it("an achieved of 0 against a positive max renders the zero tier color", () => {
    const { isCorrect, isZero } = deriveTierState(0, 5);
    expect(getTierColor(isCorrect, isZero)).toContain("red");
  });

  it("an achieved between 0 and max renders neither correct nor zero", () => {
    const { isCorrect, isZero } = deriveTierState(2, 5);
    expect(getTierColor(isCorrect, isZero)).toContain("amber");
  });
});
