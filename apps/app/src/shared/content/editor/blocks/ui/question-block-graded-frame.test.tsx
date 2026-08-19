import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuestionBlockGradedFrame } from "@/shared/content/editor/blocks/ui/question-block-graded-frame";

const REASON = "No option is marked as the correct answer";

describe("SOL13b: the reason is shown at the block", () => {
  it("an author is told why the question cannot be finished", () => {
    const { container } = render(
      <QuestionBlockGradedFrame state={null} missingSolution={REASON}>
        Which is the capital?
      </QuestionBlockGradedFrame>,
    );

    expect(container.textContent).toContain(REASON);
  });

  it("a question with nothing missing is left alone", () => {
    const { container } = render(
      <QuestionBlockGradedFrame state={null} missingSolution={null}>
        Which is the capital?
      </QuestionBlockGradedFrame>,
    );

    expect(container.textContent).toBe("Which is the capital?");
  });

  it("an inline question keeps its reason inline, so the paragraph is not broken", () => {
    const { container } = render(
      <QuestionBlockGradedFrame
        state={null}
        variant="inline"
        missingSolution={REASON}
      >
        Paris
      </QuestionBlockGradedFrame>,
    );

    expect(container.textContent).toContain(REASON);
    expect(container.querySelector("div")).toBeNull();
  });

  it("a graded block still shows its grade", () => {
    const { container } = render(
      <QuestionBlockGradedFrame state="correct" missingSolution={REASON}>
        Paris
      </QuestionBlockGradedFrame>,
    );

    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain(REASON);
  });
});
