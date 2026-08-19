import type { z } from "zod";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { askMultipleChoiceInputSchema } from "@/features/notebook/chat/tools/ux-tools";
import type { ScriptedChat } from "../__tests__/scripted-chat";

import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderScripted, scriptChat } from "../__tests__/scripted-chat";
import {
  applyChatSendAction,
  getPendingChatInteraction,
} from "./pending-chat-interaction";
import {
  registerUxTextAnswerHandler,
  resetUxTextAnswerHandlers,
} from "./ux-text-answer-bridge";

// "Which card is still actionable" is a question about turn boundaries, so the transcripts are the ones a real `useChat` builds from a scripted stream rather than hand-written parts arrays.

const ASK = "Plan a course for me.";
const FOLLOW_UP = "Actually, start with the quiz.";

const PLAN_INPUT = {
  title: "Course outline",
  steps: [{ title: "Draft the first lesson" }],
};

const OPTIONS = [{ label: "Under an hour" }, { label: "A full day" }];

const QUESTION_INPUT = {
  question: "How long should the course be?",
  options: OPTIONS,
};

const BATCH_INPUT = {
  questions: [
    { question: "Who is it for?", options: OPTIONS },
    { question: "How long?", options: OPTIONS },
  ],
};

const MESSAGES = {
  deletionPendingApproval: "Answer the deletion first.",
  planPendingApproval: "Confirm or change the plan first.",
  multipleChoicePendingApproval: "Answer the question on the card.",
  imageGenerationPendingApproval: "Answer the image request first.",
};

async function transcript(chat: ScriptedChat, asks: string[] = [ASK]) {
  const { actions, state } = renderScripted(chat, { children: null });
  for (const ask of asks) {
    await act(async () => {
      await actions.current.sendMessage({ text: ask });
    });
  }
  return state.current.messages;
}

function planTurn() {
  return scriptChat()
    .user(ASK)
    .assistant(({ writer }) => {
      writer.tool("proposePlan", {
        toolCallId: "call-plan",
        input: PLAN_INPUT,
      });
    });
}

type QuestionInput = z.input<typeof askMultipleChoiceInputSchema>;

function questionTurn(input: QuestionInput = QUESTION_INPUT) {
  return scriptChat()
    .user(ASK)
    .assistant(({ writer }) => {
      writer.tool("askMultipleChoice", {
        toolCallId: "call-question",
        input,
      });
    });
}

function send(text: string, messages: NotebookMessage[]) {
  const sendMessage = vi.fn();
  const notify = vi.fn();
  const onSubmitted = vi.fn();

  applyChatSendAction(
    { text, pending: getPendingChatInteraction(messages), messages: MESSAGES },
    { sendMessage, notify, onSubmitted },
  );

  return { sendMessage, notify, onSubmitted };
}

afterEach(() => resetUxTextAnswerHandlers());

describe("only the newest assistant turn is still being answered", () => {
  it("an unanswered plan in the newest turn is pending", async () => {
    const pending = getPendingChatInteraction(await transcript(planTurn()));

    expect(pending.plan?.toolCallId).toBe("call-plan");
  });

  it("the same plan is inert once the agent has moved past it", async () => {
    const messages = await transcript(
      planTurn().user(FOLLOW_UP).assistant("Starting with the quiz then."),
      [ASK, FOLLOW_UP],
    );

    expect(getPendingChatInteraction(messages).plan).toBeNull();
  });

  it("an abandoned card no longer blocks the composer", async () => {
    const messages = await transcript(
      questionTurn().user(FOLLOW_UP).assistant("Understood."),
      [ASK, FOLLOW_UP],
    );

    const { sendMessage, notify } = send("What about assessments?", messages);

    expect(sendMessage).toHaveBeenCalledWith({
      text: "What about assessments?",
    });
    expect(notify).not.toHaveBeenCalled();
  });

  it("a card answered in the newest turn is not pending either", async () => {
    const messages = await transcript(
      scriptChat()
        .user(ASK)
        .assistant(({ writer }) => {
          writer.tool("proposePlan", {
            toolCallId: "call-plan",
            input: PLAN_INPUT,
            output: {
              decision: "confirmed",
              steps: [{ id: "step-0", title: "Draft the first lesson" }],
            },
          });
          writer.stepStart();
          writer.text("Starting on it.", { mode: "instant" });
        }),
    );

    expect(getPendingChatInteraction(messages).plan).toBeNull();
  });
});

describe("a pending plan blocks the composer", () => {
  it("typing while a plan waits tells the author to answer it", async () => {
    const { sendMessage, notify } = send(
      "Sounds good to me",
      await transcript(planTurn()),
    );

    expect(sendMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(MESSAGES.planPendingApproval);
  });

  it("a plan blocks even when a question is on screen too", async () => {
    const messages = await transcript(
      scriptChat()
        .user(ASK)
        .assistant(({ writer }) => {
          writer.tool("askMultipleChoice", {
            toolCallId: "call-question",
            input: QUESTION_INPUT,
          });
          writer.tool("proposePlan", {
            toolCallId: "call-plan",
            input: PLAN_INPUT,
          });
        }),
    );

    const { sendMessage, notify } = send("Under an hour", messages);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(MESSAGES.planPendingApproval);
  });
});

describe("a pending question takes what the author typed", () => {
  it("the text reaches the card that asked", async () => {
    const card = vi.fn(() => true);
    registerUxTextAnswerHandler("call-question", card);

    const { sendMessage, notify } = send(
      "About two hours, split in three",
      await transcript(questionTurn()),
    );

    expect(card).toHaveBeenCalledWith("About two hours, split in three");
    expect(sendMessage).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it("a wizard step takes it the same way", async () => {
    const card = vi.fn(() => true);
    registerUxTextAnswerHandler("call-question", card);

    const { sendMessage } = send(
      "Second-year biology learners",
      await transcript(questionTurn(BATCH_INPUT)),
    );

    expect(card).toHaveBeenCalledWith("Second-year biology learners");
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("only the card the question belongs to is offered the text", async () => {
    const other = vi.fn(() => true);
    registerUxTextAnswerHandler("call-elsewhere", other);

    const { notify } = send("Under an hour", await transcript(questionTurn()));

    expect(other).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(MESSAGES.multipleChoicePendingApproval);
  });
});

describe("one Enter means one thing", () => {
  it("text a card answered with never also starts a turn", async () => {
    registerUxTextAnswerHandler("call-question", () => true);

    const { sendMessage } = send(
      "Under an hour",
      await transcript(questionTurn()),
    );

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("text a card refused is not sent behind the author's back", async () => {
    registerUxTextAnswerHandler("call-question", () => false);

    const { sendMessage, notify } = send(
      "   ",
      await transcript(questionTurn()),
    );

    expect(sendMessage).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(MESSAGES.multipleChoicePendingApproval);
  });

  it("with nothing pending, the text is just a message", async () => {
    const { sendMessage, notify } = send(
      "Add a summary slide",
      await transcript(scriptChat().user(ASK).assistant("Done.")),
    );

    expect(sendMessage).toHaveBeenCalledWith({ text: "Add a summary slide" });
    expect(notify).not.toHaveBeenCalled();
  });
});

describe("onSubmitted fires once the text is actually consumed", () => {
  it("fires for an ordinary send", async () => {
    const { onSubmitted } = send(
      "Add a summary slide",
      await transcript(scriptChat().user(ASK).assistant("Done.")),
    );

    expect(onSubmitted).toHaveBeenCalledOnce();
  });

  it("fires when a card takes the text as its answer", async () => {
    registerUxTextAnswerHandler("call-question", () => true);

    const { onSubmitted } = send(
      "Under an hour",
      await transcript(questionTurn()),
    );

    expect(onSubmitted).toHaveBeenCalledOnce();
  });

  it("does not fire while a plan blocks the send", async () => {
    const { onSubmitted } = send(
      "Sounds good to me",
      await transcript(planTurn()),
    );

    expect(onSubmitted).not.toHaveBeenCalled();
  });
});
