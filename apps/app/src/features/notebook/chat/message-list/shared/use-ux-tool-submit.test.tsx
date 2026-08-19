import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { act, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  INVALID_TOOL_INPUT,
  proposePlanOutputSchema,
} from "@/features/notebook/chat/tools/ux-tools";

import { useNotebookState } from "../../runtime/context";
import { renderScripted, scriptChat } from "../__tests__/scripted-chat";
import { useMalformedUxToolCall } from "./use-malformed-ux-tool-call";
import { useUxToolSubmit } from "./use-ux-tool-submit";

// The runtime is the thing under test here: `isLoading`, the tool part's own state machine, and the answer's round trip all come from a real `useChat` over a scripted stream — only the network is fake.

const PLAN_INPUT = {
  title: "Course outline",
  steps: [{ title: "Draft the first lesson" }],
};

const QUESTION_INPUT = {
  question: "Who is the course for?",
  options: [{ label: "Beginners" }, { label: "Practitioners" }],
};

const CONFIRMED = {
  decision: "confirmed" as const,
  steps: [{ id: "step-0", title: "Draft the first lesson" }],
};

// The card lands, then the turn holds the stream open; nothing waits out that pause — `stop()` ends the turn once the test is done asserting mid-stream.
const HELD_OPEN_MS = 30_000;

function uxTurn(tool: "proposePlan" | "askMultipleChoice") {
  return scriptChat()
    .user("Plan a course for me.")
    .assistant(({ writer }) => {
      writer.tool(tool, {
        input: tool === "proposePlan" ? PLAN_INPUT : QUESTION_INPUT,
      });
      writer.sleep(HELD_OPEN_MS);
      writer.text("Have a look at that.", { mode: "instant" });
    })
    .assistant("Starting on it.");
}

function toolPart(messages: NotebookMessage[], toolCallId: string) {
  return messages
    .flatMap((message) => message.parts)
    .find((part) => "toolCallId" in part && part.toolCallId === toolCallId);
}

function isAnsweredCall(messages: NotebookMessage[], toolCallId?: string) {
  if (!toolCallId) return false;
  const part = toolPart(messages, toolCallId);
  return Boolean(part && "state" in part && part.state?.startsWith("output"));
}

type SubmitHandle = ReturnType<typeof useUxToolSubmit<"proposePlan">>;

// Reads `isAnswered` off the transcript the way the real card does, so nothing about the answered state is hand-set.
function PlanCardProbe({
  intoRef,
  toolCallId,
}: {
  intoRef: { current: SubmitHandle };
  toolCallId?: string;
}) {
  const { messages } = useNotebookState();
  const handle = useUxToolSubmit({
    tool: "proposePlan",
    toolCallId,
    isAnswered: isAnsweredCall(messages, toolCallId),
  });
  useEffect(() => {
    intoRef.current = handle;
  });
  return <span>{handle.isInteractive ? "interactive" : "read-only"}</span>;
}

function renderPlanCard(toolCallId: string | null = "call-1") {
  const handle = { current: null as unknown as SubmitHandle };
  const onToolOutput = vi.fn();
  const view = renderScripted(uxTurn("proposePlan"), {
    onToolOutput,
    children: (
      <PlanCardProbe intoRef={handle} toolCallId={toolCallId ?? undefined} />
    ),
  });
  return { ...view, handle, onToolOutput };
}

type ScriptedView = ReturnType<typeof renderScripted>;

async function startTurn(view: ScriptedView) {
  let streamed!: Promise<void>;
  act(() => {
    streamed = view.actions.current.sendMessage({
      text: "Plan a course for me.",
    });
  });

  await waitFor(() =>
    expect(toolPart(view.state.current.messages, "call-1")).toMatchObject({
      state: "input-available",
    }),
  );
  expect(view.state.current.isLoading).toBe(true);

  return async function settle() {
    await act(async () => {
      view.actions.current.stop();
      await streamed;
    });
    await waitFor(() => expect(view.state.current.isLoading).toBe(false));
  };
}

describe("nothing is answered mid-stream", () => {
  it("a click while the turn is still streaming sends nothing", async () => {
    const view = renderPlanCard();
    const settle = await startTurn(view);

    act(() => {
      expect(view.handle.current.submit(CONFIRMED)).toBe(false);
    });
    expect(view.onToolOutput).not.toHaveBeenCalled();
    expect(view.handle.current.isInteractive).toBe(false);
    expect(screen.getByText("read-only")).toBeTruthy();

    await settle();
  });

  it("the same card answers once the turn has finished streaming", async () => {
    const view = renderPlanCard();
    const settle = await startTurn(view);

    act(() => {
      view.handle.current.submit(CONFIRMED);
    });
    await settle();

    await screen.findByText("interactive");
    await act(async () => {
      expect(view.handle.current.submit(CONFIRMED)).toBe(true);
    });

    expect(view.onToolOutput).toHaveBeenCalledTimes(1);
    expect(view.onToolOutput).toHaveBeenCalledWith({
      tool: "proposePlan",
      toolCallId: "call-1",
      output: CONFIRMED,
    });
  });
});

describe("one tool call, one answer", () => {
  it("the answer reaches the call it was issued for", async () => {
    const view = renderPlanCard();
    const settle = await startTurn(view);
    await settle();

    await act(async () => {
      view.handle.current.submit(CONFIRMED);
    });

    await waitFor(() =>
      expect(toolPart(view.state.current.messages, "call-1")).toMatchObject({
        state: "output-available",
        output: CONFIRMED,
      }),
    );
  });

  it("a double click inside one tick is still one answer", async () => {
    const view = renderPlanCard();
    const settle = await startTurn(view);
    await settle();

    await act(async () => {
      view.handle.current.submit(CONFIRMED);
      view.handle.current.submit(CONFIRMED);
    });

    expect(view.onToolOutput).toHaveBeenCalledTimes(1);
  });

  it("a card whose call the runtime already answered submits nothing", async () => {
    const view = renderPlanCard();
    const settle = await startTurn(view);
    await settle();
    await act(async () => {
      view.handle.current.submit(CONFIRMED);
    });

    await screen.findByText("read-only");
    act(() => {
      expect(view.handle.current.submit(CONFIRMED)).toBe(false);
    });

    expect(view.onToolOutput).toHaveBeenCalledTimes(1);
  });
});

describe("a card with no tool call id cannot answer", () => {
  it("submitting is refused rather than dropped somewhere else", async () => {
    const view = renderPlanCard(null);
    const settle = await startTurn(view);
    await settle();

    act(() => {
      expect(view.handle.current.submit(CONFIRMED)).toBe(false);
    });

    expect(view.onToolOutput).not.toHaveBeenCalled();
    expect(view.handle.current.hasToolCallId).toBe(false);
    expect(view.handle.current.isInteractive).toBe(false);
  });
});

function MalformedReport(props: {
  tool: "proposePlan" | "askMultipleChoice";
  toolCallId: string;
  isAnswered: boolean;
}) {
  useMalformedUxToolCall(props);
  return null;
}

// The error card only exists once its tool call does, and the hook reports as soon as it is mounted while idle — so the gate is part of what is tested.
function MalformedProbe({
  tool,
  toolCallId,
  isAnswered = false,
}: {
  tool: "proposePlan" | "askMultipleChoice";
  toolCallId: string;
  isAnswered?: boolean;
}) {
  const { messages } = useNotebookState();
  if (!toolPart(messages, toolCallId)) return null;
  return (
    <MalformedReport
      tool={tool}
      toolCallId={toolCallId}
      isAnswered={isAnswered}
    />
  );
}

function renderMalformedCard(
  tool: "proposePlan" | "askMultipleChoice",
  isAnswered = false,
) {
  const onToolOutput = vi.fn();
  const view = renderScripted(uxTurn(tool), {
    onToolOutput,
    children: (
      <MalformedProbe tool={tool} toolCallId="call-1" isAnswered={isAnswered} />
    ),
  });
  return { ...view, onToolOutput };
}

describe("a call the browser cannot render still gets an output", () => {
  it("the report waits for the stream to finish, then happens once", async () => {
    const view = renderMalformedCard("proposePlan");
    const settle = await startTurn(view);
    expect(view.onToolOutput).not.toHaveBeenCalled();

    await settle();

    expect(view.onToolOutput).toHaveBeenCalledTimes(1);
    const sent = view.onToolOutput.mock.calls[0]?.[0];
    expect(sent).toEqual({
      tool: "proposePlan",
      toolCallId: "call-1",
      output: { error: INVALID_TOOL_INPUT },
    });

    expect(proposePlanOutputSchema.safeParse(sent.output).success).toBe(true);
  });

  it("questions report it the same way", async () => {
    const view = renderMalformedCard("askMultipleChoice");
    const settle = await startTurn(view);
    await settle();

    expect(view.onToolOutput).toHaveBeenCalledWith({
      tool: "askMultipleChoice",
      toolCallId: "call-1",
      output: { error: INVALID_TOOL_INPUT },
    });
  });

  it("a malformed call that already carries an output is left alone", async () => {
    const view = renderMalformedCard("proposePlan", true);
    const settle = await startTurn(view);
    await settle();

    expect(view.onToolOutput).not.toHaveBeenCalled();
  });
});
