import type { DisplayedGrade } from "@/shared/content/contracts";

import { describe, expect, it } from "vitest";

import { buildSceneFeedbackSummary } from "./scene-feedback-summary";

function grade(achievedPoints: number, maxPoints: number): DisplayedGrade {
  return { blockId: "block-1", achievedPoints, maxPoints, spEarned: 0 };
}

describe("buildSceneFeedbackSummary", () => {
  it("SFC1: every scored block correct classifies as perfect", () => {
    expect(buildSceneFeedbackSummary([grade(4, 4), grade(2, 2)])).toEqual({
      status: "perfect",
      correctCount: 2,
      totalCount: 2,
    });
  });

  it("SFC2: a mix of correct and partial/incorrect blocks classifies as partial", () => {
    expect(buildSceneFeedbackSummary([grade(4, 4), grade(1, 2)])).toEqual({
      status: "partial",
      correctCount: 1,
      totalCount: 2,
    });
  });

  it("SFC3: no scored block earning any points classifies as incorrect", () => {
    expect(buildSceneFeedbackSummary([grade(0, 4), grade(0, 2)])).toEqual({
      status: "incorrect",
      correctCount: 0,
      totalCount: 2,
    });
  });

  it("SFC4: no graded blocks at all has no classification", () => {
    expect(buildSceneFeedbackSummary([])).toBeNull();
  });

  it("SFC5: a legacy zero-value block mixed with real ones is excluded from the count, not counted as correct", () => {
    expect(buildSceneFeedbackSummary([grade(4, 4), grade(0, 0)])).toEqual({
      status: "perfect",
      correctCount: 1,
      totalCount: 1,
    });
  });

  it("SFC6: a scene of only legacy zero-value blocks has no classification", () => {
    expect(buildSceneFeedbackSummary([grade(0, 0), grade(0, 0)])).toBeNull();
  });

  it("SFC7: correctCount and totalCount reflect only scored blocks, never the raw block count", () => {
    const summary = buildSceneFeedbackSummary([
      grade(4, 4),
      grade(2, 4),
      grade(0, 0),
    ]);
    expect(summary?.totalCount).toBe(2);
    expect(summary?.correctCount).toBe(1);
  });
});
