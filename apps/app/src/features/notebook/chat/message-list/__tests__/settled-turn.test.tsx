import type * as MessageText from "@/features/notebook/chat/get-notebook-message-text";
import type { NotebookMessage } from "../../contracts";

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getNotebookMessageText } from "@/features/notebook/chat/get-notebook-message-text";

import { ChatTurn } from "../components/chat-turn";
import { notebookTranslations } from "./scripted-chat";

// The turn body reads its user text exactly once per render, which makes this
// a render counter that costs the component nothing.
vi.mock(
  "@/features/notebook/chat/get-notebook-message-text",
  async (original) => {
    const actual = await original<typeof MessageText>();
    return { getNotebookMessageText: vi.fn(actual.getNotebookMessageText) };
  },
);

const renders = vi.mocked(getNotebookMessageText);
const onRetryMessage = () => {};

const settled = {
  index: 0,

  totalTurns: 2,
  isChatLoading: true,
  isCompacting: false,
  t: notebookTranslations,
  onRetryMessage,
};

const ask = (text: string): NotebookMessage => ({
  id: "user-1",
  role: "user",
  parts: [{ type: "text", text }],
});

describe("a turn the author already finished reading", () => {
  it("sits still while the newest turn streams", () => {
    const question = ask("What powers the cell?");
    const { rerender } = render(
      <ChatTurn {...settled} userMessage={question} />,
    );
    const drawn = renders.mock.calls.length;

    rerender(<ChatTurn {...settled} userMessage={question} />);

    expect(renders.mock.calls.length).toBe(drawn);
  });

  it("redraws when its own message is replaced", () => {
    const { rerender } = render(
      <ChatTurn {...settled} userMessage={ask("What powers the cell?")} />,
    );
    const drawn = renders.mock.calls.length;

    rerender(<ChatTurn {...settled} userMessage={ask("Say that again?")} />);

    expect(renders.mock.calls.length).toBeGreaterThan(drawn);
  });
});
