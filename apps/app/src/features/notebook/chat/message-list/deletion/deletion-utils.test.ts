import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { describe, expect, it } from "vitest";

import {
  getDeletionInvocations,
  getPendingDeletionInvocation,
} from "./deletion-utils";

type Part = NotebookMessage["parts"][number];

function deleteScenesPart(
  sceneIds: string[],
  overrides: Partial<Part> = {},
): Part {
  return {
    type: "tool-deleteScenes",
    toolCallId: `call-${sceneIds.join("-")}`,
    state: "approval-requested",
    approval: { id: `approval-${sceneIds.join("-")}` },
    input: {
      courseId: "course-1",
      sceneIds,
    },
    ...overrides,
  } as Part;
}

function deleteLessonsPart(
  lessonIds: string[],
  overrides: Partial<Part> = {},
): Part {
  return {
    type: "tool-deleteLessons",
    toolCallId: `call-${lessonIds.join("-")}`,
    state: "approval-requested",
    approval: { id: `approval-${lessonIds.join("-")}` },
    input: {
      courseId: "course-1",
      lessonIds,
    },
    ...overrides,
  } as Part;
}

function assistantTurn(parts: Part[]): NotebookMessage {
  return { id: "message-1", role: "assistant", parts } as NotebookMessage;
}

describe("one card answers exactly one tool call", () => {
  it("two deletion calls in one turn are two independent decisions", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([
        deleteScenesPart(["scene-1"]),
        deleteScenesPart(["scene-2"]),
      ]),
    );

    expect(invocations).toHaveLength(2);
    expect(invocations[0]?.ids).toEqual(["scene-1"]);
    expect(invocations[1]?.ids).toEqual(["scene-2"]);
  });

  it("each card answers only its own approval", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([
        deleteScenesPart(["scene-1"]),
        deleteScenesPart(["scene-2"]),
      ]),
    );

    expect(invocations[0]?.approval).toEqual({
      approvalId: "approval-scene-1",
      toolCallId: "call-scene-1",
    });
    expect(invocations[1]?.approval).toEqual({
      approvalId: "approval-scene-2",
      toolCallId: "call-scene-2",
    });
  });

  it("calls of different kinds stay separate", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([
        deleteScenesPart(["scene-1"]),
        deleteLessonsPart(["lesson-1"]),
      ]),
    );

    expect(invocations.map((invocation) => invocation.kind)).toEqual([
      "scene",
      "lesson",
    ]);
  });

  it("adjacent calls separated by prose are still two decisions", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([
        deleteScenesPart(["scene-1"]),
        { type: "text", text: "and also" } as Part,
        deleteScenesPart(["scene-2"]),
      ]),
    );

    expect(invocations).toHaveLength(2);
  });

  it("a card carries the items of its own call only, however many it holds", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([
        deleteScenesPart(["scene-1", "scene-2", "scene-3"]),
        deleteScenesPart(["scene-4"]),
      ]),
    );

    expect(invocations[0]?.ids).toHaveLength(3);
    expect(invocations[1]?.ids).toHaveLength(1);
  });

  it("answering one call leaves the other pending", () => {
    const pending = getPendingDeletionInvocation([
      assistantTurn([
        deleteScenesPart(["scene-1"], {
          state: "approval-responded",
          approval: { id: "approval-scene-1", approved: true },
        }),
        deleteScenesPart(["scene-2"]),
      ]),
    ]);

    expect(pending?.ids).toEqual(["scene-2"]);
  });

  it("a turn with nothing left to decide has no pending card", () => {
    const pending = getPendingDeletionInvocation([
      assistantTurn([
        deleteScenesPart(["scene-1"], {
          state: "output-available",
          output: { success: true },
        }),
      ]),
    ]);

    expect(pending).toBeNull();
  });
});

describe("what a card reports about its own state", () => {
  function statusOf(overrides: Partial<Part>) {
    const [invocation] = getDeletionInvocations(
      assistantTurn([deleteScenesPart(["scene-1"], overrides)]),
    );
    return invocation?.status;
  }

  it("a call still being put to the author has nothing to confirm yet", () => {
    expect(statusOf({ state: "input-available", approval: undefined })).toBe(
      "streaming",
    );
  });

  it("a call waiting on the author is awaiting approval", () => {
    expect(statusOf({})).toBe("awaiting-approval");
  });

  it("a denied call reads as denied, not as pending", () => {
    expect(
      statusOf({
        state: "approval-responded",
        approval: { id: "approval-scene-1", approved: false },
      }),
    ).toBe("denied");
  });

  it("a call the SDK itself marked denied reads the same way", () => {
    expect(
      statusOf({
        state: "output-denied",
        approval: { id: "approval-scene-1", approved: false },
      }),
    ).toBe("denied");
  });

  it("an approved call is already deleted — the rows go before the stream returns", () => {
    expect(
      statusOf({
        state: "approval-responded",
        approval: { id: "approval-scene-1", approved: true },
      }),
    ).toBe("deleted");
  });

  it("a confirmed call reads as deleted", () => {
    expect(
      statusOf({ state: "output-available", output: { success: true } }),
    ).toBe("deleted");
  });

  it("a failed call keeps its error rather than reading as done", () => {
    const [invocation] = getDeletionInvocations(
      assistantTurn([
        deleteScenesPart(["scene-1"], {
          state: "output-error",
          errorText: "Cannot delete the only scene in a lesson.",
        }),
      ]),
    );

    expect(invocation?.status).toBe("failed");
    expect(invocation?.errorText).toContain("only scene");
  });

  it("a call rejected by its own schema produces no card at all", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([
        deleteScenesPart(["scene-1"], {
          state: "output-error",
          approval: undefined,
          errorText: "Invalid input for tool deleteScenes: courseId required",
        }),
      ]),
    );

    expect(invocations).toEqual([]);
  });

  it("a call the agent never finished sending produces no card", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([
        { type: "tool-deleteScenes", state: "input-streaming" } as Part,
      ]),
    );

    expect(invocations).toEqual([]);
  });

  it("a deletion call naming nothing produces no card", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([deleteScenesPart([])]),
    );

    expect(invocations).toEqual([]);
  });

  it("a transcript written before ids-only deletions stops rendering", () => {
    const invocations = getDeletionInvocations(
      assistantTurn([
        deleteScenesPart(["scene-1"], {
          input: {
            courseId: "course-1",
            scenes: [{ sceneId: "scene-1", title: "Intro" }],
          },
        } as Partial<Part>),
      ]),
    );

    expect(invocations).toEqual([]);
  });
});
