import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { describe, expect, it } from "vitest";

import { isContinuationRequest } from "../continuation";
import { shouldSendAfterApprovalResponses } from "./approval-tools";

type Part = NotebookMessage["parts"][number];

interface DeletionPartOverrides {
  toolCallId?: string;
  state?: string;
  approval?: { id: string; approved: boolean };
  output?: { success: boolean };
  errorText?: string;
}

function deletionPart(overrides: DeletionPartOverrides = {}): Part {
  return {
    type: "tool-deleteScenes",
    toolCallId: "call-1",
    state: "approval-requested",
    approval: { id: "approval-1" },
    input: { courseId: "course-1", scenes: [{ sceneId: "scene-1" }] },
    ...overrides,
  } as Part;
}

const approved = { id: "approval-1", approved: true };
const denied = { id: "approval-1", approved: false };

function assistant(parts: Part[]): NotebookMessage {
  return { id: "message-1", role: "assistant", parts } as NotebookMessage;
}

function resumes(parts: Part[]) {
  return shouldSendAfterApprovalResponses({ messages: [assistant(parts)] });
}

describe("resuming once the deletion has landed", () => {
  it("resumes when the approved call has its result", () => {
    expect(
      resumes([
        deletionPart({
          state: "output-available",
          approval: approved,
          output: { success: true },
        }),
      ]),
    ).toBe(true);
  });

  it("resumes when the approved call failed — the agent needs to hear that too", () => {
    expect(
      resumes([
        deletionPart({
          state: "output-error",
          approval: approved,
          errorText: "Cannot delete the only scene in a lesson.",
        }),
      ]),
    ).toBe(true);
  });

  it("does not resume twice once the agent has already spoken", () => {
    expect(
      resumes([
        deletionPart({
          state: "output-available",
          approval: approved,
          output: { success: true },
        }),
        { type: "text", text: "Deleted them." } as Part,
      ]),
    ).toBe(false);
  });

  it("a turn with no approval-gated call is not resumed", () => {
    expect(
      resumes([{ type: "text", text: "Here is your outline." } as Part]),
    ).toBe(false);
  });

  it("the author's own turn is never resumed on their behalf", () => {
    expect(
      shouldSendAfterApprovalResponses({
        messages: [
          {
            id: "m",
            role: "user",
            parts: [{ type: "text", text: "hi" }],
          } as NotebookMessage,
        ],
      }),
    ).toBe(false);
  });

  it("waits for every approved call in the turn, not just the first", () => {
    expect(
      resumes([
        deletionPart({
          state: "output-available",
          approval: approved,
          output: { success: true },
        }),
        deletionPart({
          toolCallId: "call-2",
          state: "approval-responded",
          approval: { id: "approval-2", approved: true },
        }),
      ]),
    ).toBe(false);
  });
});

describe("the auto-send happens once, not on every stream finish", () => {
  function autoSendCount(parts: Part[], continuation: Part[]): number {
    const current = [...parts];
    let sends = 0;

    while (sends < 5 && resumes(current)) {
      sends += 1;
      current.push(...continuation);
    }
    return sends;
  }

  const deleted = deletionPart({
    state: "output-available",
    approval: approved,
    output: { success: true },
  });

  it("a continuation that has only opened its step does not trigger another", () => {
    expect(autoSendCount([deleted], [{ type: "step-start" } as Part])).toBe(1);
  });

  it("nor does one that has already replied", () => {
    expect(
      autoSendCount(
        [deleted],
        [
          { type: "step-start" } as Part,
          { type: "text", text: "Deleted them." } as Part,
        ],
      ),
    ).toBe(1);
  });

  it("a denial resumes once as well", () => {
    expect(
      autoSendCount(
        [deletionPart({ state: "approval-responded", approval: denied })],
        [{ type: "step-start" } as Part],
      ),
    ).toBe(1);
  });
});

describe("denials resume, unfinished approvals do not", () => {
  it("a denial resumes the conversation so the refusal is acknowledged", () => {
    expect(
      resumes([
        deletionPart({ state: "approval-responded", approval: denied }),
      ]),
    ).toBe(true);
  });

  it("a denial not yet recorded does not resume", () => {
    expect(
      resumes([
        deletionPart({ state: "approval-requested", approval: denied }),
      ]),
    ).toBe(false);
  });

  it("an approval whose deletion has not produced a result does not resume", () => {
    expect(
      resumes([
        deletionPart({ state: "approval-responded", approval: approved }),
      ]),
    ).toBe(false);
  });

  it("a card still waiting on the author does not resume", () => {
    expect(resumes([deletionPart()])).toBe(false);
  });
});

describe("what a resumed request carries", () => {
  it("a request after an approval is marked as a continuation", () => {
    expect(
      isContinuationRequest([
        assistant([
          deletionPart({ state: "approval-responded", approval: approved }),
        ]),
        { id: "m", role: "user", parts: [] } as NotebookMessage,
      ]),
    ).toBe(true);
  });

  it("a request after a denial is too", () => {
    expect(
      isContinuationRequest([
        assistant([deletionPart({ state: "output-denied", approval: denied })]),
        { id: "m", role: "user", parts: [] } as NotebookMessage,
      ]),
    ).toBe(true);
  });

  it("a fresh question with no decision behind it is not a continuation", () => {
    expect(
      isContinuationRequest([
        assistant([{ type: "text", text: "Here you go." } as Part]),
        {
          id: "m",
          role: "user",
          parts: [{ type: "text", text: "thanks" }],
        } as NotebookMessage,
      ]),
    ).toBe(false);
  });
});
