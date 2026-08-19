import type { QuestionBlockSnapshot } from "@/shared/content/contracts";

import { describe, expect, it } from "vitest";

import { buildGradingManifest } from "@/shared/content/editor/assessment/publish/publish-artifacts";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";

function block(sp: number | undefined): QuestionBlockSnapshot {
  return {
    blockId: "block-1",
    blockType: INPUT_FIELD_NODE_NAME,
    attributes: {
      optional: false,
      questionData: { answer: "mitochondrion" },
      userAnswers: null,
      sp,
    },
  };
}

describe("SP4: publishing always gives a question block a concrete SP value", () => {
  it("keeps the author's sp when they set one", () => {
    const [entry] = buildGradingManifest([block(40)]);

    expect(entry.sp).toBe(40);
  });

  it("defaults to 10 when the author never set one", () => {
    const [entry] = buildGradingManifest([block(undefined)]);

    expect(entry.sp).toBe(10);
  });
});
