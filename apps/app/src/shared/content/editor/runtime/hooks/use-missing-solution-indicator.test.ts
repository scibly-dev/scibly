import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import { INPUT_FIELD_NODE_NAME } from "@/shared/content/editor/blocks/questions/input-field/schema";
import { useMissingSolutionIndicator } from "@/shared/content/editor/runtime/hooks/use-missing-solution-indicator";

// Covers when the missing-solution warning is shown while authoring, not the
// completeness rule itself (see solution-completeness.test.ts).

const NO_ANSWER_KEY = { answer: "", caseSensitive: false };
const ANSWERED = { answer: "Paris", caseSensitive: false };

const WELL_PAST_ANY_PAUSE = 10_000;

function elapse(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SOL14: a block the author has not touched is left alone", () => {
  it("an incomplete question opened but not edited says nothing", () => {
    const { result } = renderHook(() =>
      useMissingSolutionIndicator({
        blockType: INPUT_FIELD_NODE_NAME,
        questionData: NO_ANSWER_KEY,
        isAuthoring: true,
      }),
    );

    elapse(WELL_PAST_ANY_PAUSE);

    expect(result.current).toBeNull();
  });

  it("a question inserted and then edited elsewhere in the scene is still untouched", () => {
    const { result, rerender } = renderHook(
      (questionData: typeof NO_ANSWER_KEY) =>
        useMissingSolutionIndicator({
          blockType: INPUT_FIELD_NODE_NAME,
          questionData,
          isAuthoring: true,
        }),
      { initialProps: NO_ANSWER_KEY },
    );

    rerender({ ...NO_ANSWER_KEY });
    elapse(WELL_PAST_ANY_PAUSE);

    expect(result.current).toBeNull();
  });
});

describe("SOL13: once the author has worked on a block, it is marked — after a pause", () => {
  it("nothing is shown while the author is still typing", () => {
    const { result, rerender } = renderHook(
      (questionData: typeof NO_ANSWER_KEY) =>
        useMissingSolutionIndicator({
          blockType: INPUT_FIELD_NODE_NAME,
          questionData,
          isAuthoring: true,
        }),
      { initialProps: ANSWERED },
    );

    rerender({ answer: "P", caseSensitive: false });
    rerender({ answer: "", caseSensitive: false });

    expect(result.current).toBeNull();
  });

  it("the reason appears once they stop", () => {
    const { result, rerender } = renderHook(
      (questionData: typeof NO_ANSWER_KEY) =>
        useMissingSolutionIndicator({
          blockType: INPUT_FIELD_NODE_NAME,
          questionData,
          isAuthoring: true,
        }),
      { initialProps: ANSWERED },
    );

    rerender(NO_ANSWER_KEY);
    elapse(WELL_PAST_ANY_PAUSE);

    expect(result.current).not.toBeNull();
  });

  it("and goes away again when they finish the question", () => {
    const { result, rerender } = renderHook(
      (questionData: typeof NO_ANSWER_KEY) =>
        useMissingSolutionIndicator({
          blockType: INPUT_FIELD_NODE_NAME,
          questionData,
          isAuthoring: true,
        }),
      { initialProps: ANSWERED },
    );

    rerender(NO_ANSWER_KEY);
    elapse(WELL_PAST_ANY_PAUSE);
    expect(result.current).not.toBeNull();

    rerender(ANSWERED);
    elapse(WELL_PAST_ANY_PAUSE);
    expect(result.current).toBeNull();
  });
});

describe("SOL15: the author is told what publishing would tell them", () => {
  it("word for word, because it is the same rule being read", () => {
    const { result, rerender } = renderHook(
      (questionData: typeof NO_ANSWER_KEY) =>
        useMissingSolutionIndicator({
          blockType: INPUT_FIELD_NODE_NAME,
          questionData,
          isAuthoring: true,
        }),
      { initialProps: ANSWERED },
    );

    rerender(NO_ANSWER_KEY);
    elapse(WELL_PAST_ANY_PAUSE);

    expect(result.current).toBe(
      questionBlockParserRegistry.describeMissingSolution(
        INPUT_FIELD_NODE_NAME,
        NO_ANSWER_KEY,
      ),
    );
  });
});

describe("SOL13: only an author sees this", () => {
  it("a learner working through the scene is shown nothing", () => {
    const { result, rerender } = renderHook(
      (questionData: typeof NO_ANSWER_KEY) =>
        useMissingSolutionIndicator({
          blockType: INPUT_FIELD_NODE_NAME,
          questionData,
          isAuthoring: false,
        }),
      { initialProps: ANSWERED },
    );

    rerender(NO_ANSWER_KEY);
    elapse(WELL_PAST_ANY_PAUSE);

    expect(result.current).toBeNull();
  });
});
