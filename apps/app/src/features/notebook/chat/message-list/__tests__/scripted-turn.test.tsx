import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  notebookTranslations,
  renderScripted,
  renderTurn,
  scriptChat,
} from "./scripted-chat";

const mcq = notebookTranslations.chat.multipleChoice;
const thinking = notebookTranslations.chat.thinking;
const CONTINUE = notebookTranslations.chat.errorRetryPrompt;

const click = (element: HTMLElement) =>
  act(() => void fireEvent.click(element));

const AUDIENCE_QUESTIONS = {
  questions: [
    {
      question: "Who is the course for?",
      options: [{ label: "Beginners" }, { label: "Practitioners" }],
    },
    {
      question: "How long should it run?",
      options: [{ label: "One hour" }, { label: "A full day" }],
    },
    {
      question: "Which formats fit?",
      options: [{ label: "Video" }, { label: "Reading" }],
      allowMultiple: true,
    },
  ],
};

describe("a turn the author watches arrive", () => {
  it("preamble text stays on screen once a tool call lands behind it", async () => {
    const chat = scriptChat()
      .user("Plan a course from my sources.")
      .assistant(({ writer }) => {
        writer.reasoning("Checking the existing courses first.");
        writer.text("Let me ask a few quick questions to shape it.", {
          mode: "instant",
        });
        writer.tool("askMultipleChoice", { input: AUDIENCE_QUESTIONS });
      });

    const { actions } = renderScripted(chat, { delayMs: undefined });
    await act(async () => {
      await actions.current.sendMessage({
        text: "Plan a course from my sources.",
      });
    });

    await screen.findByText(/quick questions to shape it/);
    await screen.findByText("Who is the course for?");
    expect(screen.getByText(/quick questions to shape it/)).toBeTruthy();
  });

  it("text between two steps stays a reply once the step behind it lands", async () => {
    const chat = scriptChat()
      .user("Draft a lesson from my sources.")
      .assistant(({ writer }) => {
        writer.reasoning("Checking the sources first.");

        writer.text("Let me look through your material.", { mode: "instant" });
        writer.tool("searchNotebookSources", {
          input: { query: "photosynthesis" },
          output: {
            results: [],
            reason: "NO_NOTEBOOK",
            retry: false,
            message: "This notebook has no sources yet.",
          },
        });
        writer.text("Here is the draft.", { mode: "instant" });
      });

    const { actions } = renderScripted(chat, { delayMs: 10 });
    let streamed!: Promise<void>;
    act(() => {
      streamed = actions.current.sendMessage({
        text: "Draft a lesson from my sources.",
      });
    });

    const narration = await screen.findByText(/look through your material/);
    await act(async () => {
      await streamed;
    });

    await screen.findByText("Here is the draft.");

    expect(narration.isConnected).toBe(true);
    expect(screen.getByText(/look through your material/)).toBe(narration);
  });

  it("a half-arrived question shows a skeleton, never the error card", () => {
    const streaming = renderTurn([
      {
        type: "tool-askMultipleChoice",
        toolCallId: "call-1",
        state: "input-streaming",
        input: { questions: [{ question: "Who is the cou" }] },
      },
    ]);
    expect(streaming.container.querySelector("[aria-busy]")).not.toBeNull();
    expect(screen.queryByText(mcq.invalidQuestion)).toBeNull();
    streaming.unmount();

    const settled = renderTurn([
      {
        type: "tool-askMultipleChoice",
        toolCallId: "call-1",
        state: "input-available",
        input: AUDIENCE_QUESTIONS,
      },
    ]);
    expect(settled.container.querySelector("[aria-busy]")).toBeNull();
    expect(screen.getByText("Who is the course for?")).toBeTruthy();
    expect(screen.queryByText(mcq.invalidQuestion)).toBeNull();
  });

  it("a thinking block opened mid-stream is still open when the turn ends", async () => {
    const chat = scriptChat()
      .user("Find something in my sources.")
      .assistant(({ writer }) => {
        writer.reasoning("Looking through the sources first.");
        writer.text("Give me a moment.", { mode: "instant" });
        writer.tool("searchNotebookSources", {
          input: { query: "photosynthesis" },
          output: {
            results: [],
            reason: "NO_NOTEBOOK",
            retry: false,
            message: "This notebook has no sources yet.",
          },
        });
        writer.reasoning("Nothing there, so I will answer from the outline.");
        writer.text("Here is what I found.", { mode: "instant" });
      });

    const { actions } = renderScripted(chat, { delayMs: 10 });
    let streamed!: Promise<void>;
    act(() => {
      streamed = actions.current.sendMessage({
        text: "Find something in my sources.",
      });
    });

    const [toggle] = await screen.findAllByRole("button", {
      name: thinking.active,
    });
    click(toggle!);
    expect(toggle!.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      await streamed;
    });
    await screen.findByText("Here is what I found.");

    expect(toggle!.isConnected).toBe(true);
    expect(toggle!.getAttribute("aria-expanded")).toBe("true");
  });

  it("retrying a failed turn keeps what the model already wrote", async () => {
    const chat = scriptChat()
      .user("Summarize my sources.")
      .assistant(({ writer }) => {
        writer.text("Here is the first half of the summary.", {
          mode: "instant",
        });
        writer.error("The model provider fell over.");
      })
      .user(CONTINUE)
      .assistant("And here is the rest of it.");

    const { actions, state } = renderScripted(chat, { delayMs: undefined });
    await act(async () => {
      await actions.current.sendMessage({ text: "Summarize my sources." });
    });

    await screen.findByText("Here is the first half of the summary.");
    expect(state.current.chatError).not.toBeNull();

    await act(async () => {
      actions.current.retry(CONTINUE);
    });

    await screen.findByText("And here is the rest of it.");
    expect(
      screen.getByText("Here is the first half of the summary."),
    ).toBeTruthy();
    expect(state.current.chatError).toBeNull();
    expect(
      state.current.messages
        .filter((message) => message.role === "user")
        .map((message) =>
          message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join(""),
        ),
    ).toEqual(["Summarize my sources.", CONTINUE]);
  });

  it("a three-question wizard answers back in question order", async () => {
    const chat = scriptChat()
      .user("Ask me about the audience.")
      .assistant(({ writer }) => {
        writer.tool("askMultipleChoice", { input: AUDIENCE_QUESTIONS });
      })
      .assistant(({ writer, toolCall }) => {
        writer.text(JSON.stringify(toolCall?.output), { mode: "instant" });
      });

    const { actions } = renderScripted(chat, { delayMs: undefined });
    await act(async () => {
      await actions.current.sendMessage({ text: "Ask me about the audience." });
    });

    await screen.findByText("Who is the course for?");
    click(screen.getByRole("radio", { name: "Beginners" }));
    click(screen.getByRole("button", { name: mcq.next }));

    await screen.findByText("How long should it run?");
    click(screen.getByRole("button", { name: mcq.skip }));

    await screen.findByText("Which formats fit?");
    click(screen.getByRole("checkbox", { name: "Video" }));
    click(screen.getByRole("checkbox", { name: "Reading" }));
    click(screen.getByRole("button", { name: mcq.submitAnswers }));

    const echoed = await screen.findByText(
      /selectedLabels/,
      {},
      { timeout: 3000 },
    );
    expect(JSON.parse(echoed.textContent ?? "{}")).toEqual({
      answers: [
        {
          questionId: "q-0",
          selectedOptionIds: ["q0-opt-0"],
          selectedLabels: ["Beginners"],
        },
        {
          questionId: "q-1",
          selectedOptionIds: [],
          selectedLabels: [],
          skipped: true,
        },
        {
          questionId: "q-2",
          selectedOptionIds: ["q2-opt-0", "q2-opt-1"],
          selectedLabels: ["Video", "Reading"],
        },
      ],
    });
  });
});
