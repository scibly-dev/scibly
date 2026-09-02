// @vitest-environment node
import {
  CLIENT_CAPABILITIES_META_KEY,
  isInputRequiredResult,
} from "@modelcontextprotocol/server";
import { describe, expect, it } from "vitest";

import { approval, type ApprovalRefusals, approvalToken } from "./approval";

const REFUSALS: ApprovalRefusals = {
  cancelled: "no answer",
  declined: "declined",
  mismatched: "wrong items",
};

const TOKEN = approvalToken("deleteScenes", "course-1", ["a", "b"]);

function ctx(answer?: {
  action: string;
  content?: unknown;
  requestState?: string;
}) {
  return {
    mcpReq: {
      envelope: { [CLIENT_CAPABILITIES_META_KEY]: { elicitation: {} } },
      inputResponses: answer
        ? { confirm: { action: answer.action, content: answer.content } }
        : undefined,
      requestState: () => answer?.requestState,
    },
  } as never;
}

function ask(answer?: Parameters<typeof ctx>[0]) {
  return approval(ctx(answer), {
    token: TOKEN,
    message: "Delete two scenes?",
    refusals: REFUSALS,
  });
}

function refusal(result: ReturnType<typeof ask>) {
  const content = (result as { content?: { text: string }[] }).content;
  return JSON.parse(content![0]!.text) as {
    success: boolean;
    message: string;
  };
}

describe("the approval gate", () => {
  it("A1: asks on the first round, carrying what the author reads and what it binds to", () => {
    const result = ask();

    expect(isInputRequiredResult(result)).toBe(true);
    expect(result).toMatchObject({
      requestState: TOKEN,
      inputRequests: { confirm: { params: { message: "Delete two scenes?" } } },
    });
  });

  it("A2: lets the caller through only on a ticked box against the state it issued", () => {
    expect(
      ask({
        action: "accept",
        content: { confirm: true },
        requestState: TOKEN,
      }),
    ).toBeNull();
  });

  it("A3: an approval for one set of items does not authorize another", () => {
    const result = ask({
      action: "accept",
      content: { confirm: true },
      requestState: approvalToken("deleteScenes", "course-1", ["c"]),
    });

    expect(refusal(result)).toEqual({
      success: false,
      message: REFUSALS.mismatched,
    });
  });

  it("A3: nor does one with no state echoed back at all", () => {
    const result = ask({ action: "accept", content: { confirm: true } });

    expect(refusal(result).message).toBe(REFUSALS.mismatched);
  });

  it("A4: an accepted form with the box left unticked is still a no", () => {
    const result = ask({
      action: "accept",
      content: { confirm: false },
      requestState: TOKEN,
    });

    expect(refusal(result).message).toBe(REFUSALS.declined);
  });

  it("A4: so is an accepted form that answered nothing", () => {
    const result = ask({ action: "accept", requestState: TOKEN });

    expect(refusal(result).message).toBe(REFUSALS.declined);
  });

  it("A4: an explicit decline is a no", () => {
    const result = ask({ action: "decline", requestState: TOKEN });

    expect(refusal(result).message).toBe(REFUSALS.declined);
  });

  it("A5: a dismissed dialog is unanswered, not declined — the author never saw the question through", () => {
    const result = ask({ action: "cancel", requestState: TOKEN });

    expect(refusal(result).message).toBe(REFUSALS.cancelled);
  });
});

describe("approvalToken", () => {
  it("A6: does not care what order the caller listed the items in", () => {
    expect(approvalToken("deleteScenes", "course-1", ["b", "a"])).toBe(TOKEN);
  });

  it("A6: tells apart the tool, the course and the items", () => {
    expect(approvalToken("deleteLessons", "course-1", ["a", "b"])).not.toBe(
      TOKEN,
    );
    expect(approvalToken("deleteScenes", "course-2", ["a", "b"])).not.toBe(
      TOKEN,
    );
    expect(approvalToken("deleteScenes", "course-1", ["a"])).not.toBe(TOKEN);
  });

  it("A7: cannot be re-cut, so an id that looks like a separator is not two items", () => {
    expect(approvalToken("deleteScenes", "course-1", ['a","b'])).not.toBe(
      TOKEN,
    );
  });
});
