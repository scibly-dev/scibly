import { describe, expect, it } from "vitest";

import { parseAskMultipleChoiceInput, parseProposePlanInput } from "./ux-tools";

const OPTIONS = [{ label: "Beginners" }, { label: "Practitioners" }];

describe("parseAskMultipleChoiceInput", () => {
  it("parses a call that carries no ids at all", () => {
    expect(
      parseAskMultipleChoiceInput({ question: "Who for?", options: OPTIONS }),
    ).toEqual({
      questions: [
        {
          id: "q-0",
          question: "Who for?",
          options: [
            { id: "q0-opt-0", label: "Beginners" },
            { id: "q0-opt-1", label: "Practitioners" },
          ],
          allowMultiple: undefined,
        },
      ],
    });
  });

  it("accepts a one-item questions array", () => {
    const parsed = parseAskMultipleChoiceInput({
      questions: [{ question: "Who for?", options: OPTIONS }],
    });

    expect(parsed?.questions).toHaveLength(1);
    expect(parsed?.questions[0]?.id).toBe("q-0");
  });

  it("prefers questions when the model sends both shapes", () => {
    const parsed = parseAskMultipleChoiceInput({
      question: "Shorthand leftover",
      options: OPTIONS,
      questions: [
        { question: "Who for?", options: OPTIONS },
        { question: "How long?", options: OPTIONS, allowMultiple: true },
      ],
    });

    expect(parsed?.questions.map((entry) => entry.question)).toEqual([
      "Who for?",
      "How long?",
    ]);
  });

  it("scopes option ids per question so labels may repeat", () => {
    const parsed = parseAskMultipleChoiceInput({
      questions: [
        { question: "Who for?", options: OPTIONS },
        { question: "Who else?", options: OPTIONS },
      ],
    });

    expect(parsed?.questions[1]?.options[0]?.id).toBe("q1-opt-0");
  });

  it("rejects a call with no answerable question", () => {
    expect(parseAskMultipleChoiceInput({ question: "Who for?" })).toBeNull();
    expect(
      parseAskMultipleChoiceInput({
        question: "Who for?",
        options: [{ label: "Only one" }],
      }),
    ).toBeNull();
    expect(parseAskMultipleChoiceInput({ questions: [] })).toBeNull();
  });
});

describe("parseProposePlanInput", () => {
  it("assigns positional step ids", () => {
    expect(
      parseProposePlanInput({
        title: "Course outline",
        steps: [{ title: "Draft lesson one" }, { title: "Add a quiz" }],
      })?.steps,
    ).toEqual([
      { id: "step-0", title: "Draft lesson one", detail: undefined },
      { id: "step-1", title: "Add a quiz", detail: undefined },
    ]);
  });

  it("rejects a plan with no steps", () => {
    expect(
      parseProposePlanInput({ title: "Course outline", steps: [] }),
    ).toBeNull();
  });
});
