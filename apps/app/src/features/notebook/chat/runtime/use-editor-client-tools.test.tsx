import type { ChatOnToolCallCallback } from "ai";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { ClientToolContext } from "@/features/notebook/tools/insert-content/client";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleClientToolCall } from "@/features/notebook/tools/insert-content/client";

import {
  INITIAL_STATE,
  useCourseBuilderStore,
} from "../../course-builder/course-builder-store";
import { useEditorClientTools } from "./use-editor-client-tools";

// The handler is covered by the insert-content suite; this file tests only the wiring — which calls reach it, what runtime it gets, and where the answer posts back.
vi.mock("@/features/notebook/tools/insert-content/client", () => ({
  handleClientToolCall: vi.fn(),
}));

type Options = Parameters<typeof useEditorClientTools>[0];
type OnToolCall = ChatOnToolCallCallback<NotebookMessage>;
type OnToolCallRef = { current: OnToolCall };

const PANEL_COURSE = { id: "course-the-panel-shows", title: "Onboarding" };
const OPEN_SCENE = { id: "scene-open", title: "Introduction" };
const REMOTE = {
  course: { id: "course-of-the-scene", title: "Cyber Safety" },
  lesson: { id: "lesson-of-the-scene", title: "Spotting phishing" },
  scene: { id: "scene-elsewhere", title: "The suspicious link" },
};

function fakeUtils() {
  return {
    client: {
      scene: {
        setSceneLineage: {
          mutate: vi.fn(
            async (_input: {
              sceneId: string;
              sourceIds: string[];
              notebookId?: string;
            }) => ({
              courseId: REMOTE.course.id,
              lessonId: REMOTE.lesson.id,
            }),
          ),
        },
        getSceneContent: {
          query: vi.fn(async (_input: { sceneId: string }) => ({
            html: "<p>What is already there.</p>",
            sourceIds: ["source-1", "source-2"],
          })),
        },
        writeSceneContent: {
          mutate: vi.fn(
            async (_input: {
              sceneId: string;
              html: string;
              mode: "replace" | "append";
            }) => ({ sceneId: _input.sceneId, success: true as const }),
          ),
        },
      },
    },
    scene: {
      getSceneLocation: {
        fetch: vi.fn(async (_input: { sceneId: string }) => REMOTE),
      },
      getLessonScenes: {
        invalidate: vi.fn((_input: { lessonId: string }) => undefined),
      },
    },
    course: {
      getOutdatedScenes: {
        invalidate: vi.fn((_input: { courseId: string }) => undefined),
      },
    },
  };
}

function mount({ notebook = "linked" }: { notebook?: "linked" | "none" } = {}) {
  const onToolCallRef: OnToolCallRef = { current: () => undefined };
  const addToolOutput = vi.fn();
  const props = {
    activeNotebookIdRef: {
      current: notebook === "linked" ? "notebook-1" : undefined,
    },
    utils: fakeUtils(),
    addToolOutput,
    onToolCallRef,
  };
  const { rerender } = renderHook(
    (current: Options) => useEditorClientTools(current),
    { initialProps: props as unknown as Options },
  );

  return {
    onToolCallRef,
    addToolOutput,
    utils: props.utils,
    swapRuntime: (next: Partial<typeof props>) =>
      rerender({ ...props, ...next } as unknown as Options),
  };
}

function fire(
  onToolCallRef: OnToolCallRef,
  toolCall: Partial<Parameters<OnToolCall>[0]["toolCall"]> = {},
) {
  onToolCallRef.current({
    toolCall: {
      dynamic: false,
      toolCallId: "call-1",
      toolName: "insertContent",
      input: { sceneId: undefined, html: "<p>Drafted.</p>" },
      ...toolCall,
    },
  } as unknown as Parameters<OnToolCall>[0]);
}

const handled = vi.mocked(handleClientToolCall);
const lastContext = () => handled.mock.calls.at(-1)?.[1] as ClientToolContext;
const lastCall = () => handled.mock.calls.at(-1)?.[0];

beforeEach(() => {
  handled.mockClear();
  useCourseBuilderStore.setState(INITIAL_STATE);
});

describe("which calls this browser answers", () => {
  it("a scene write is one of them", () => {
    const { onToolCallRef } = mount();

    fire(onToolCallRef, { toolName: "insertContent" });

    expect(handled).toHaveBeenCalledTimes(1);
  });

  it("so is a scene read", () => {
    const { onToolCallRef } = mount();

    fire(onToolCallRef, { toolName: "getSceneContent" });

    expect(handled).toHaveBeenCalledTimes(1);
  });

  it("a tool the cards answer is left to the cards", () => {
    const { onToolCallRef } = mount();

    fire(onToolCallRef, { toolName: "proposePlan" });

    expect(handled).not.toHaveBeenCalled();
  });

  it("a dynamic call is left alone, whatever it is named", () => {
    const { onToolCallRef } = mount();

    fire(onToolCallRef, { dynamic: true, toolName: "insertContent" });

    expect(handled).not.toHaveBeenCalled();
  });

  it("the call reaches the handler as it arrived", () => {
    const { onToolCallRef } = mount();
    const input = { sceneId: "scene-7", html: "<p>Drafted.</p>" };

    fire(onToolCallRef, { toolCallId: "call-9", input });

    expect(lastCall()).toEqual({
      toolCallId: "call-9",
      toolName: "insertContent",
      input,
    });
  });
});

describe("the runtime the handler is given", () => {
  it("falls back to the scene the author is looking at", () => {
    useCourseBuilderStore.getState().openCourse({ course: PANEL_COURSE });
    useCourseBuilderStore.getState().setActiveScene(OPEN_SCENE);
    const { onToolCallRef } = mount();

    fire(onToolCallRef);

    expect(lastContext().activeSceneId).toBe(OPEN_SCENE.id);
  });

  it("has no fallback when nothing is open", () => {
    const { onToolCallRef } = mount();

    fire(onToolCallRef);

    expect(lastContext().activeSceneId).toBeUndefined();
  });

  it("a write goes to the server, even for the scene the author has open", async () => {
    useCourseBuilderStore.getState().setActiveScene(OPEN_SCENE);
    const { onToolCallRef, utils } = mount();
    fire(onToolCallRef);

    await lastContext().writeSceneContent({
      sceneId: OPEN_SCENE.id,
      html: "<p>Drafted.</p>",
      mode: "replace",
    });

    expect(utils.client.scene.writeSceneContent.mutate).toHaveBeenCalledWith({
      sceneId: OPEN_SCENE.id,
      html: "<p>Drafted.</p>",
      mode: "replace",
    });
  });

  it("a notebook behind the course makes grounding advice worth giving", () => {
    const { onToolCallRef } = mount();

    fire(onToolCallRef);

    expect(lastContext().hasLinkedNotebook).toBe(true);
  });

  it("with no notebook there is nothing to ground against", () => {
    const { onToolCallRef } = mount({ notebook: "none" });

    fire(onToolCallRef);

    expect(lastContext().hasLinkedNotebook).toBe(false);
  });
});

describe("posting the answer back to the call that asked", () => {
  it("an answer carrying sourceIds is a scene read", () => {
    const { onToolCallRef, addToolOutput } = mount();
    fire(onToolCallRef, { toolName: "getSceneContent", toolCallId: "call-4" });

    const output = { sceneId: "scene-7", sourceIds: ["source-1"], html: "<p>" };
    lastContext().addToolOutput(output);

    expect(addToolOutput).toHaveBeenCalledWith({
      tool: "getSceneContent",
      toolCallId: "call-4",
      output,
    });
  });

  it("an answer without them is a write", () => {
    const { onToolCallRef, addToolOutput } = mount();
    fire(onToolCallRef, { toolCallId: "call-4" });

    const output = { success: true, html: "<p>Drafted.</p>" };
    lastContext().addToolOutput(output);

    expect(addToolOutput).toHaveBeenCalledWith({
      tool: "insertContent",
      toolCallId: "call-4",
      output,
    });
  });

  it("a failed read is still a read", () => {
    const { onToolCallRef, addToolOutput } = mount();
    fire(onToolCallRef, { toolName: "getSceneContent" });

    lastContext().addToolOutput({
      sceneId: "scene-7",
      sourceIds: [],
      error: "No such scene.",
    });

    expect(addToolOutput).toHaveBeenCalledWith(
      expect.objectContaining({ tool: "getSceneContent" }),
    );
  });
});

describe("recording what a write was grounded in", () => {
  it("names the notebook the write came from", async () => {
    const { onToolCallRef, utils } = mount();
    fire(onToolCallRef);

    await lastContext().recordSceneLineage?.({
      sceneId: "scene-7",
      sourceIds: ["source-1"],
    });

    expect(utils.client.scene.setSceneLineage.mutate).toHaveBeenCalledWith({
      sceneId: "scene-7",
      sourceIds: ["source-1"],
      notebookId: "notebook-1",
    });
  });

  it("names none when the course has no notebook behind it", async () => {
    const { onToolCallRef, utils } = mount({ notebook: "none" });
    fire(onToolCallRef);

    await lastContext().recordSceneLineage?.({
      sceneId: "scene-7",
      sourceIds: ["source-1"],
    });

    expect(
      utils.client.scene.setSceneLineage.mutate.mock.calls[0]?.[0],
    ).toStrictEqual({
      sceneId: "scene-7",
      sourceIds: ["source-1"],
      notebookId: undefined,
    });
  });

  it("refreshes the scene's own course, not the one the panel happens to show", async () => {
    useCourseBuilderStore.getState().openCourse({ course: PANEL_COURSE });
    const { onToolCallRef, utils } = mount();
    fire(onToolCallRef);

    await lastContext().recordSceneLineage?.({
      sceneId: REMOTE.scene.id,
      sourceIds: ["source-1"],
    });

    expect(utils.course.getOutdatedScenes.invalidate).toHaveBeenCalledWith({
      courseId: REMOTE.course.id,
    });
    expect(utils.scene.getLessonScenes.invalidate).toHaveBeenCalledWith({
      lessonId: REMOTE.lesson.id,
    });
  });

  it("a scene's content and its sources arrive together, in one read", async () => {
    const { onToolCallRef, utils } = mount();
    fire(onToolCallRef);

    await expect(lastContext().readSceneContent("scene-7")).resolves.toEqual({
      html: "<p>What is already there.</p>",
      sourceIds: ["source-1", "source-2"],
    });
    expect(utils.client.scene.getSceneContent.query).toHaveBeenCalledWith({
      sceneId: "scene-7",
    });
  });
});

describe("pointing the builder at the scene about to change", () => {
  it("the panel follows a scene it was not already on", async () => {
    useCourseBuilderStore.getState().openCourse({ course: PANEL_COURSE });
    useCourseBuilderStore.getState().setActiveScene(OPEN_SCENE);
    const { onToolCallRef, utils } = mount();
    fire(onToolCallRef);

    await lastContext().announceTargetScene?.(REMOTE.scene.id);

    expect(utils.scene.getSceneLocation.fetch).toHaveBeenCalledWith({
      sceneId: REMOTE.scene.id,
    });
    expect(useCourseBuilderStore.getState().agentTarget?.scene).toEqual(
      REMOTE.scene,
    );
  });

  it("a write into the open scene announces nothing", async () => {
    useCourseBuilderStore.getState().openCourse({ course: PANEL_COURSE });
    useCourseBuilderStore.getState().setActiveScene(OPEN_SCENE);
    const { onToolCallRef, utils } = mount();
    fire(onToolCallRef);

    await lastContext().announceTargetScene?.(OPEN_SCENE.id);

    expect(utils.scene.getSceneLocation.fetch).not.toHaveBeenCalled();
  });
});

describe("the callbacks keep pointing at the live runtime", () => {
  it("a later render's chat receives the answer", () => {
    const { onToolCallRef, addToolOutput, swapRuntime } = mount();
    fire(onToolCallRef);
    const laterAddToolOutput = vi.fn();

    swapRuntime({ addToolOutput: laterAddToolOutput });
    lastContext().addToolOutput({ success: true, html: "<p>Drafted.</p>" });

    expect(laterAddToolOutput).toHaveBeenCalledTimes(1);
    expect(addToolOutput).not.toHaveBeenCalled();
  });

  it("a later render's query client records the lineage", async () => {
    const { onToolCallRef, utils, swapRuntime } = mount();
    fire(onToolCallRef);
    const laterUtils = fakeUtils();

    swapRuntime({ utils: laterUtils });
    await lastContext().recordSceneLineage?.({
      sceneId: "scene-7",
      sourceIds: ["source-1"],
    });

    expect(laterUtils.client.scene.setSceneLineage.mutate).toHaveBeenCalled();
    expect(utils.client.scene.setSceneLineage.mutate).not.toHaveBeenCalled();
  });
});
