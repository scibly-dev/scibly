import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  INITIAL_STATE,
  useCourseBuilderStore,
} from "../../course-builder/course-builder-store";
import { createNotebookTransport } from "./notebook-transport";

// Driven through `sendMessages`, so what the assertions read is the JSON that
// reaches `fetch` rather than the return of a hand-called option.

type Part = NotebookMessage["parts"][number];
type Transport = ReturnType<typeof createNotebookTransport>;
type SendMessagesOptions = Parameters<Transport["sendMessages"]>[0];

const refs = {
  orgSlugRef: { current: "acme" },
  activeNotebookIdRef: { current: "notebook-1" as string | undefined },
  currentModelIdRef: { current: "test-model" },
};

const callbacks = {
  setActiveNotebookId: vi.fn(),
  onNotebookCreated: vi.fn(),
};

const COURSE = { id: "course-1", title: "Cyber Safety" };
const LESSON = { id: "lesson-1", title: "Spotting phishing" };
const SCENE = { id: "scene-1", title: "Introduction" };

function user(id: string, text: string): NotebookMessage {
  return { id, role: "user", parts: [{ type: "text", text }] };
}

function assistant(id: string, ...parts: Part[]): NotebookMessage {
  return { id, role: "assistant", parts };
}

function deletionPart(state: string): Part {
  return {
    type: "tool-deleteLessons",
    toolCallId: "call-delete",
    state,
    input: { courseId: "course-1", lessonIds: ["lesson-1"] },
    approval: { id: "approval-1", approved: state !== "output-denied" },
  } as Part;
}

let fetchSpy: ReturnType<typeof vi.fn>;

function respondWith(headers: Record<string, string> = {}) {
  fetchSpy.mockResolvedValue({
    ok: true,
    body: new ReadableStream<Uint8Array>({
      start: (controller) => controller.close(),
    }),
    headers: { get: (name: string) => headers[name] ?? null },
  });
}

async function sendVia(
  transport: Transport,
  messages: NotebookMessage[],
  options: { body?: SendMessagesOptions["body"] } = {},
) {
  await transport.sendMessages({
    trigger: "submit-message",
    chatId: "chat-1",
    messageId: undefined,
    messages,
    abortSignal: undefined,
    ...options,
  });
  return JSON.parse(fetchSpy.mock.calls.at(-1)?.[1].body as string);
}

function send(
  messages: NotebookMessage[],
  options: { body?: SendMessagesOptions["body"] } = {},
) {
  return sendVia(createNotebookTransport(refs, callbacks), messages, options);
}

beforeEach(() => {
  useCourseBuilderStore.setState(INITIAL_STATE);
  refs.orgSlugRef.current = "acme";
  refs.activeNotebookIdRef.current = "notebook-1";
  refs.currentModelIdRef.current = "test-model";
  callbacks.setActiveNotebookId.mockClear();
  callbacks.onNotebookCreated.mockClear();
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  respondWith();
});

afterEach(() => vi.unstubAllGlobals());

describe("how much of the transcript goes out", () => {
  it("a fresh ask sends only the message the author just typed", async () => {
    const body = await send([
      user("m1", "Plan a course"),
      assistant("m2", { type: "text", text: "Here you go." }),
      user("m3", "Add a quiz"),
    ]);

    expect(body.message.id).toBe("m3");
    expect(body.messages).toBeUndefined();
  });

  it("a resumed turn sends the whole transcript, so the decision travels with it", async () => {
    const body = await send([
      user("m1", "Delete lesson two"),
      assistant("m2", deletionPart("approval-responded")),
      user("m3", ""),
    ]);

    expect(body.messages).toHaveLength(3);
    expect(body.message).toBeUndefined();
  });

  it("a refusal travels the same way", async () => {
    const body = await send([
      user("m1", "Delete lesson two"),
      assistant("m2", deletionPart("output-denied")),
      user("m3", ""),
    ]);

    expect(body.messages).toHaveLength(3);
    expect(body.message).toBeUndefined();
  });

  it("a turn the author did not end is a continuation", async () => {
    const body = await send([
      user("m1", "Write the intro"),
      assistant("m2", { type: "text", text: "Writing it." }),
    ]);

    expect(body.messages).toHaveLength(2);
    expect(body.message).toBeUndefined();
  });

  it("a settled approval from an older turn does not re-send the transcript", async () => {
    const body = await send([
      user("m1", "Delete lesson two"),
      assistant("m2", deletionPart("output-available")),
      user("m3", "Now add a quiz"),
    ]);

    expect(body.messages).toBeUndefined();
    expect(body.message.id).toBe("m3");
  });
});

describe("what the request is addressed to", () => {
  it("carries the notebook, org and model", async () => {
    const body = await send([user("m1", "Hello")]);

    expect(body).toMatchObject({
      notebookId: "notebook-1",
      orgSlug: "acme",
      modelId: "test-model",
    });
  });

  it("reads them when the request is built, not when the transport was made", async () => {
    const transport = createNotebookTransport(refs, callbacks);
    refs.orgSlugRef.current = "globex";
    refs.activeNotebookIdRef.current = "notebook-2";
    refs.currentModelIdRef.current = "another-model";

    expect(await sendVia(transport, [user("m1", "Hello")])).toMatchObject({
      notebookId: "notebook-2",
      orgSlug: "globex",
      modelId: "another-model",
    });
  });

  it("a notebook that does not exist yet is simply absent", async () => {
    refs.activeNotebookIdRef.current = undefined;

    expect(await send([user("m1", "Hello")])).not.toHaveProperty("notebookId");
  });

  it("keeps whatever the caller put in the body", async () => {
    const body = await send([user("m1", "Hello")], {
      body: { trigger: "regenerate-message" },
    });

    expect(body.trigger).toBe("regenerate-message");
    expect(body.orgSlug).toBe("acme");
  });
});

describe("the course the author is looking at rides along", () => {
  it("no open course means no context at all", async () => {
    expect(await send([user("m1", "Hello")])).not.toHaveProperty(
      "courseContext",
    );
  });

  it("an open course travels with no lesson or scene of its own", async () => {
    useCourseBuilderStore.getState().openCourse({ course: COURSE });

    const { courseContext } = await send([user("m1", "Hello")]);

    expect(courseContext.course).toEqual(COURSE);
    expect(courseContext.lesson).toBeUndefined();
    expect(courseContext.scene).toBeUndefined();
  });

  it("the lesson and scene the panel sits on travel with it", async () => {
    const store = useCourseBuilderStore.getState();
    store.openCourse({ course: COURSE });
    useCourseBuilderStore.getState().setActiveLesson(LESSON);
    useCourseBuilderStore.getState().setActiveScene(SCENE);

    const { courseContext } = await send([user("m1", "Hello")]);

    expect(courseContext).toEqual({
      course: COURSE,
      lesson: LESSON,
      scene: SCENE,
    });
  });

  it("a lesson with no course behind it sends nothing", async () => {
    useCourseBuilderStore.setState({ activeLesson: LESSON });

    expect(await send([user("m1", "Hello")])).not.toHaveProperty(
      "courseContext",
    );
  });
});

describe("a notebook the server created mid-request", () => {
  it("is adopted from the response header", async () => {
    respondWith({ "x-notebook-id": "notebook-fresh" });

    await send([user("m1", "Hello")]);

    expect(callbacks.setActiveNotebookId).toHaveBeenCalledWith(
      "notebook-fresh",
    );
    expect(callbacks.onNotebookCreated).toHaveBeenCalledWith({
      orgSlug: "acme",
      notebookId: "notebook-fresh",
    });
  });

  it("is announced under the org the request went out with", async () => {
    respondWith({ "x-notebook-id": "notebook-fresh" });
    refs.orgSlugRef.current = "globex";

    await send([user("m1", "Hello")]);

    expect(callbacks.onNotebookCreated).toHaveBeenCalledWith({
      orgSlug: "globex",
      notebookId: "notebook-fresh",
    });
  });

  it("a response without the header changes nothing", async () => {
    await send([user("m1", "Hello")]);

    expect(callbacks.setActiveNotebookId).not.toHaveBeenCalled();
    expect(callbacks.onNotebookCreated).not.toHaveBeenCalled();
  });
});
