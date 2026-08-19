import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type {
  AgentDeleteLessonsInput,
  AgentDeleteScenesInput,
} from "@/features/notebook/chat/tools/deletion-schemas";
import type { ScriptedChat } from "../__tests__/scripted-chat";
import type { DeletionInvocation } from "./deletion.types";

import { act, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import courseBuilderEn from "../../../course-builder/i18n/course-builder.i18n.en.json";
import { useNotebookState } from "../../runtime/context";
import { renderScripted, scriptChat } from "../__tests__/scripted-chat";
import { getDeletionInvocations } from "./deletion-utils";
import { useDeletionApproval } from "./use-deletion-approval";

// The approval round trip is the thing under test — the card answers a real `tool-approval-request` and the runtime decides on its own whether the turn continues; only the network (the transport and the two mutations) is faked.

const { deleteScene, deleteLesson, applyCourseBuilderDeletionEffects } =
  vi.hoisted(() => ({
    deleteScene: vi.fn(),
    deleteLesson: vi.fn(),
    applyCourseBuilderDeletionEffects: vi.fn(),
  }));

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    useUtils: () => ({
      client: {
        scene: { deleteScene: { mutate: deleteScene } },
        course: { deleteLesson: { mutate: deleteLesson } },
      },
    }),
  },
}));

vi.mock("../../../course-builder/hooks/invalidate-course-scene-state", () => ({
  applyCourseBuilderDeletionEffects,
}));

const cb = courseBuilderEn.notebook.studio.courseBuilder;

const COURSE = "course-1";
const ASK = "Delete what I no longer need.";
const DONE = "That is gone now.";
const KEPT = "Left everything in place.";

const SCENES: AgentDeleteScenesInput = {
  courseId: COURSE,
  reason: "Both scenes repeat the lesson intro.",
  scenes: [
    {
      sceneId: "scene-1",
      title: "Intro",
      lessonId: "l1",
      lessonTitle: "Lesson 1",
    },
    {
      sceneId: "scene-2",
      title: "Outro",
      lessonId: "l1",
      lessonTitle: "Lesson 1",
    },
  ],
};

const LESSONS: AgentDeleteLessonsInput = {
  courseId: COURSE,
  lessons: [{ lessonId: "lesson-1", title: "Cell division" }],
};

function followUp(toolCall: { denied?: boolean } | undefined) {
  return toolCall?.denied ? KEPT : DONE;
}

function scenesTurn(input: AgentDeleteScenesInput = SCENES) {
  return scriptChat()
    .user(ASK)
    .assistant(({ writer }) => {
      writer.tool("deleteScenes", { input, needsApproval: true });
    })
    .assistant(({ writer, toolCall }) => {
      writer.text(followUp(toolCall), { mode: "instant" });
    });
}

function lessonsTurn(input: AgentDeleteLessonsInput = LESSONS) {
  return scriptChat()
    .user(ASK)
    .assistant(({ writer }) => {
      writer.tool("deleteLessons", { input, needsApproval: true });
    })
    .assistant(({ writer, toolCall }) => {
      writer.text(followUp(toolCall), { mode: "instant" });
    });
}

type DeletionHandle = ReturnType<typeof useDeletionApproval>;

function DeletionCard({
  invocation,
  intoRef,
}: {
  invocation: DeletionInvocation;
  intoRef: { current: DeletionHandle };
}) {
  const handle = useDeletionApproval({ invocation, cb });
  useEffect(() => {
    intoRef.current = handle;
  });
  return null;
}

/**
 * Reads the invocation off the transcript the way the real card does, so every
 * state the assertions rely on is one the runtime actually produced.
 */
function DeletionGate({ intoRef }: { intoRef: { current: DeletionHandle } }) {
  const { messages } = useNotebookState();
  const invocation = messages.flatMap((message) =>
    getDeletionInvocations(message),
  )[0];
  if (!invocation) return null;
  return <DeletionCard invocation={invocation} intoRef={intoRef} />;
}

function deletionPart(messages: NotebookMessage[]) {
  return messages
    .flatMap((message) => message.parts)
    .find(
      (part) =>
        part.type === "tool-deleteScenes" || part.type === "tool-deleteLessons",
    );
}

function transcriptText(messages: NotebookMessage[]) {
  return messages
    .flatMap((message) => message.parts)
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ");
}

async function openCard(chat: ScriptedChat) {
  const handle = { current: null as unknown as DeletionHandle };
  const onToolOutput = vi.fn();
  const view = renderScripted(chat, {
    onToolOutput,
    children: <DeletionGate intoRef={handle} />,
  });

  await act(async () => {
    await view.actions.current.sendMessage({ text: ASK });
  });
  await waitFor(() => expect(handle.current).not.toBeNull());

  return { ...view, handle, onToolOutput };
}

type CardView = Awaited<ReturnType<typeof openCard>>;

async function respond(view: CardView, approved: boolean) {
  await act(async () => {
    if (approved) view.handle.current.handleApprove();
    else view.handle.current.handleDeny();
  });
}

async function waitForFollowUp(view: CardView, reply: string) {
  await waitFor(() =>
    expect(transcriptText(view.state.current.messages)).toContain(reply),
  );
}

function serverDeleted(sceneIds: string[]) {
  return {
    success: true,
    deleted: sceneIds.map((sceneId) => ({
      sceneId,
      lessonId: "l1",
      courseId: COURSE,
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteScene.mockResolvedValue(serverDeleted(["scene-1", "scene-2"]));
  deleteLesson.mockResolvedValue({
    success: true,
    deletedLessonIds: ["lesson-1"],
  });
});

describe("nothing is deleted without a click", () => {
  it("an unanswered card has deleted nothing and reported nothing", async () => {
    const view = await openCard(scenesTurn());

    expect(view.handle.current.canRespond).toBe(true);
    expect(deleteScene).not.toHaveBeenCalled();
    expect(view.onToolOutput).not.toHaveBeenCalled();
    expect(deletionPart(view.state.current.messages)).toMatchObject({
      state: "approval-requested",
    });
  });

  it("denying runs no mutation and attaches no output", async () => {
    const view = await openCard(scenesTurn());

    await respond(view, false);
    await waitForFollowUp(view, KEPT);

    expect(deleteScene).not.toHaveBeenCalled();
    expect(applyCourseBuilderDeletionEffects).not.toHaveBeenCalled();
    expect(view.onToolOutput).not.toHaveBeenCalled();
  });

  it("a card that already ran cannot delete a second time", async () => {
    const view = await openCard(scenesTurn());
    await respond(view, true);
    await waitForFollowUp(view, DONE);

    expect(view.handle.current.canRespond).toBe(false);
    await respond(view, true);

    expect(deleteScene).toHaveBeenCalledTimes(1);
  });

  it("a call the agent never put up for approval cannot act", async () => {
    const view = await openCard(
      scriptChat()
        .user(ASK)
        .assistant(({ writer }) => {
          writer.tool("deleteScenes", { input: SCENES });
        }),
    );

    expect(view.handle.current.canRespond).toBe(false);
    await respond(view, true);

    expect(deleteScene).not.toHaveBeenCalled();
  });
});

describe("a click deletes exactly what the card listed", () => {
  it("the mutation carries precisely the displayed scene ids", async () => {
    const view = await openCard(scenesTurn());

    await respond(view, true);
    await waitForFollowUp(view, DONE);

    expect(deleteScene).toHaveBeenCalledWith({
      sceneIds: ["scene-1", "scene-2"],
    });
  });

  it("a lesson deletion is scoped to the course the card names", async () => {
    const view = await openCard(lessonsTurn());

    await respond(view, true);
    await waitForFollowUp(view, DONE);

    expect(deleteLesson).toHaveBeenCalledWith({
      courseId: COURSE,
      lessonIds: ["lesson-1"],
    });
  });
});

describe("a decision is made once", () => {
  it("two clicks in the same tick delete once", async () => {
    let release: (value: unknown) => void = () => {};
    deleteScene.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const view = await openCard(scenesTurn());

    await act(async () => {
      view.handle.current.handleApprove();
      view.handle.current.handleApprove();
      release(serverDeleted(["scene-1", "scene-2"]));
    });
    await waitForFollowUp(view, DONE);

    expect(deleteScene).toHaveBeenCalledTimes(1);
    expect(view.onToolOutput).toHaveBeenCalledTimes(1);
  });
});

describe("a deletion the server refuses", () => {
  const refusal = {
    success: false,
    code: "LAST_SCENE",
    message:
      "Cannot delete the only scene in a lesson. Use deleteLesson to remove the entire lesson instead.",
  };

  it("the refusal reaches the model, carrying the server's own instruction", async () => {
    deleteScene.mockResolvedValue(refusal);
    const view = await openCard(scenesTurn());

    await respond(view, true);
    await waitForFollowUp(view, DONE);

    expect(deletionPart(view.state.current.messages)).toMatchObject({
      state: "output-error",
      errorText: expect.stringContaining("deleteLesson"),
    });
  });

  it("the turn still finishes rather than dangling on the approval", async () => {
    deleteScene.mockResolvedValue(refusal);
    const view = await openCard(scenesTurn());

    await respond(view, true);

    await waitForFollowUp(view, DONE);
    expect(deletionPart(view.state.current.messages)).toMatchObject({
      approval: { approved: true },
    });
  });

  it("the author sees the same message, and the builder is untouched", async () => {
    deleteScene.mockResolvedValue(refusal);
    const view = await openCard(scenesTurn());

    await respond(view, true);
    await waitForFollowUp(view, DONE);

    expect(view.handle.current.localError).toBe(refusal.message);
    expect(applyCourseBuilderDeletionEffects).not.toHaveBeenCalled();

    expect(view.onToolOutput).toHaveBeenCalledTimes(1);
    expect(view.onToolOutput.mock.calls[0]?.[0]).toEqual({
      tool: "deleteScenes",
      toolCallId: "call-1",
      state: "output-error",
      errorText: refusal.message,
    });
  });

  it("a lesson deletion with no course to run against is an error, not silence", async () => {
    const view = await openCard(
      lessonsTurn({ lessons: LESSONS.lessons } as AgentDeleteLessonsInput),
    );

    await respond(view, true);
    await waitForFollowUp(view, DONE);

    expect(deleteLesson).not.toHaveBeenCalled();
    expect(view.handle.current.localError).toContain("course");
    expect(deletionPart(view.state.current.messages)).toMatchObject({
      state: "output-error",
    });
  });
});

describe("the model is told what the server deleted", () => {
  it("an id the server did not delete is not reported as deleted", async () => {
    deleteScene.mockResolvedValue(serverDeleted(["scene-1"]));
    const view = await openCard(scenesTurn());

    await respond(view, true);
    await waitForFollowUp(view, DONE);

    expect(deletionPart(view.state.current.messages)).toMatchObject({
      state: "output-available",
      output: {
        courseId: COURSE,
        deleted: [
          {
            sceneId: "scene-1",
            title: "Intro",
            lessonTitle: "Lesson 1",
            lessonId: "l1",
            courseId: COURSE,
          },
        ],
      },
    });
    expect(applyCourseBuilderDeletionEffects).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "scene", deletedIds: ["scene-1"] }),
    );
  });

  it("the same holds for lessons", async () => {
    deleteLesson.mockResolvedValue({ success: true, deletedLessonIds: [] });
    const view = await openCard(lessonsTurn());

    await respond(view, true);
    await waitForFollowUp(view, DONE);

    expect(deletionPart(view.state.current.messages)).toMatchObject({
      output: { deletedLessonIds: [], deletedLessons: [] },
    });
  });

  it("everything the server did delete is reported, with the card's titles", async () => {
    const view = await openCard(scenesTurn());

    await respond(view, true);
    await waitForFollowUp(view, DONE);

    const [sent] = view.onToolOutput.mock.calls[0] ?? [];
    expect(sent).toMatchObject({
      tool: "deleteScenes",
      toolCallId: "call-1",
      output: { deleted: [{ title: "Intro" }, { title: "Outro" }] },
    });
  });
});

describe("a denial is reported as a denial", () => {
  it("the model is told the deletion was refused, not that it happened", async () => {
    const view = await openCard(scenesTurn());

    await respond(view, false);
    await waitForFollowUp(view, KEPT);

    expect(deletionPart(view.state.current.messages)).toMatchObject({
      state: "output-denied",
      approval: { approved: false },
    });
  });
});
