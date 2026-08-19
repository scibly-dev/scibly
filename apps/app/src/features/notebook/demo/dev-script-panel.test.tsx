import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  renderScripted,
  scriptChat,
} from "../chat/message-list/__tests__/scripted-chat";
import { isChatSettled } from "./dev-script-panel";

const ASK = "Plan a course for me.";

async function transcript(chat: ReturnType<typeof scriptChat>) {
  const { actions, state } = renderScripted(chat, { children: null });
  await act(async () => {
    await actions.current.sendMessage({ text: ASK });
  });
  return state.current;
}

describe("isChatSettled", () => {
  it("is settled with no messages and no streaming", () => {
    expect(isChatSettled([], false)).toBe(true);
  });

  it("is not settled while a reply is still streaming", () => {
    expect(isChatSettled([], true)).toBe(false);
  });

  it("is not settled while a multiple-choice card is unanswered", async () => {
    const { messages, isLoading } = await transcript(
      scriptChat()
        .user(ASK)
        .assistant(({ writer }) => {
          writer.tool("askMultipleChoice", {
            toolCallId: "call-question",
            input: {
              question: "How long should the course be?",
              options: [{ label: "Under an hour" }, { label: "A full day" }],
            },
          });
        }),
    );

    expect(isChatSettled(messages, isLoading)).toBe(false);
  });

  it("is settled once the assistant reply finishes with nothing pending", async () => {
    const { messages, isLoading } = await transcript(
      scriptChat().user(ASK).assistant("Done."),
    );

    expect(isChatSettled(messages, isLoading)).toBe(true);
  });
});
